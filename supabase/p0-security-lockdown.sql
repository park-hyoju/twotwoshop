-- =============================================================================
-- TWOTWOSHOP P0 Security Lockdown (2026-07-15)
-- =============================================================================
-- PURPOSE (run once in Supabase SQL Editor on PRODUCTION after review):
--   1) is_admin() = JWT app_metadata.role only (no user_profiles.role)
--   2) Block members from changing user_profiles.role (trigger)
--   3) Drop known legacy open policies (anon using(true) write paths)
--   4) Re-assert create_shop_order_with_stock with server-side prices + stock locks
--   5) Revoke direct table INSERT on orders/order_items from clients
--
-- SAFE: no DROP TABLE, no TRUNCATE, no DELETE of business data.
-- IDEMPOTENT: may be re-run; uses DROP POLICY IF EXISTS / CREATE OR REPLACE.
--
-- PREREQUISITE: Existing tables (products, orders, order_items, user_profiles...).
-- AFTER RUN: node scripts/live-security-verification.mjs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) Diagnostic notices (read-only probes)
-- -----------------------------------------------------------------------------
do $probe$
declare
  r record;
begin
  raise notice '[p0-lockdown] probing is_admin() source...';
  if to_regprocedure('public.is_admin()') is not null then
    raise notice '[p0-lockdown] is_admin() currently: %',
      pg_get_functiondef('public.is_admin()'::regprocedure);
  else
    raise notice '[p0-lockdown] is_admin() missing — will create';
  end if;

  raise notice '[p0-lockdown] policies with qual/with_check = true on critical tables:';
  for r in
    select tablename, policyname, cmd, roles::text, qual, with_check
      from pg_policies
     where schemaname = 'public'
       and tablename in (
         'products', 'orders', 'order_items', 'customers',
         'user_profiles', 'customer_inquiries', 'banners'
       )
       and (
         coalesce(qual, '') in ('true', '(true)')
         or coalesce(with_check, '') in ('true', '(true)')
       )
  loop
    raise notice '  %.% cmd=% roles=% qual=% check=%',
      r.tablename, r.policyname, r.cmd, r.roles, r.qual, r.with_check;
  end loop;
end
$probe$;

-- -----------------------------------------------------------------------------
-- 1) is_admin() — JWT app_metadata only (+ auth.users app meta fallback)
--    Does NOT read user_profiles.role (prevents self-elevation).
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    (
      select coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin'
        from auth.users u
       where u.id = auth.uid()
    ),
    false
  );
$$;

comment on function public.is_admin() is
  'P0 lockdown: true only when JWT/auth.users app_metadata.role = admin. Ignores user_profiles.role.';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2) user_profiles.role — block client escalation
-- -----------------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists role text;

comment on column public.user_profiles.role is
  'DEPRECATED for authorization. Do not grant admin via this column. Use auth app_metadata.role.';

create or replace function public.prevent_user_profiles_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := false;
begin
  begin
    v_is_admin := public.is_admin();
  exception
    when others then
      v_is_admin := false;
  end;

  if tg_op = 'INSERT' then
    if new.role is not null
       and btrim(new.role) <> ''
       and lower(btrim(new.role)) <> 'member'
       and not v_is_admin then
      new.role := null;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role and not v_is_admin then
      raise exception 'ROLE_CHANGE_FORBIDDEN'
        using errcode = '42501',
              hint = 'user_profiles.role cannot be changed by non-admin clients';
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_user_profiles_role_change on public.user_profiles;

create trigger trg_prevent_user_profiles_role_change
  before insert or update on public.user_profiles
  for each row
  execute function public.prevent_user_profiles_role_change();

-- -----------------------------------------------------------------------------
-- 3) Drop known legacy OPEN policies (names from archived admin-*-rls.sql)
--    Hardened replacements use *_admin_role / *_storefront (see production-security-rls).
-- -----------------------------------------------------------------------------
do $drop_open$
begin
  -- products
  if to_regclass('public.products') is not null then
    execute 'drop policy if exists "products_select_admin" on public.products';
    execute 'drop policy if exists "products_insert_admin" on public.products';
    execute 'drop policy if exists "products_update_admin" on public.products';
    execute 'drop policy if exists "products_delete_admin" on public.products';
  end if;

  -- orders / items / customers (legacy anon-open names)
  if to_regclass('public.orders') is not null then
    execute 'drop policy if exists "orders_select_admin" on public.orders';
    execute 'drop policy if exists "orders_update_admin" on public.orders';
    execute 'drop policy if exists "orders_insert_anon" on public.orders';
  end if;

  if to_regclass('public.order_items') is not null then
    execute 'drop policy if exists "order_items_select_admin" on public.order_items';
    execute 'drop policy if exists "order_items_insert_anon" on public.order_items';
  end if;

  if to_regclass('public.customers') is not null then
    execute 'drop policy if exists "customers_select_admin" on public.customers';
    execute 'drop policy if exists "customers_insert_anon" on public.customers';
  end if;

  -- Legacy "any authenticated" inquiry / customer PII (if still named this way)
  if to_regclass('public.customer_inquiries') is not null then
    execute 'drop policy if exists "inquiries_select_authenticated" on public.customer_inquiries';
    execute 'drop policy if exists "inquiries_update_authenticated" on public.customer_inquiries';
    execute 'drop policy if exists "customer_inquiries_select_authenticated" on public.customer_inquiries';
    execute 'drop policy if exists "customer_inquiries_update_authenticated" on public.customer_inquiries';
  end if;

  if to_regclass('public.customers') is not null then
    execute 'drop policy if exists "customers_select_authenticated" on public.customers';
    execute 'drop policy if exists "customers_update_authenticated" on public.customers';
  end if;
end
$drop_open$;

-- -----------------------------------------------------------------------------
-- 4) Re-assert products RLS (storefront read + admin write) if table exists
-- -----------------------------------------------------------------------------
do $products_rls$
begin
  if to_regclass('public.products') is null then
    raise notice '[p0-lockdown] SKIP products RLS: table missing';
    return;
  end if;

  alter table public.products enable row level security;

  revoke insert, update, delete on table public.products from anon;
  grant select on table public.products to anon, authenticated;
  grant insert, update, delete on table public.products to authenticated;

  drop policy if exists "products_select_storefront" on public.products;
  create policy "products_select_storefront"
    on public.products
    for select
    to anon, authenticated
    using (status = 'active' or public.is_admin());

  drop policy if exists "products_insert_admin_role" on public.products;
  create policy "products_insert_admin_role"
    on public.products
    for insert
    to authenticated
    with check (public.is_admin());

  drop policy if exists "products_update_admin_role" on public.products;
  create policy "products_update_admin_role"
    on public.products
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

  drop policy if exists "products_delete_admin_role" on public.products;
  create policy "products_delete_admin_role"
    on public.products
    for delete
    to authenticated
    using (public.is_admin());

  raise notice '[p0-lockdown] APPLIED products storefront/admin RLS';
end
$products_rls$;

-- -----------------------------------------------------------------------------
-- 5) Orders: revoke direct client INSERT; keep admin + own-row SELECT
-- -----------------------------------------------------------------------------
do $orders_rls$
begin
  if to_regclass('public.orders') is null then
    raise notice '[p0-lockdown] SKIP orders RLS: table missing';
    return;
  end if;

  alter table public.orders enable row level security;
  if to_regclass('public.order_items') is not null then
    alter table public.order_items enable row level security;
  end if;
  if to_regclass('public.customers') is not null then
    alter table public.customers enable row level security;
  end if;

  -- Checkout must go through SECURITY DEFINER RPC only
  revoke insert, update, delete on table public.orders from anon;
  revoke insert, update, delete on table public.orders from authenticated;
  grant select on table public.orders to authenticated;
  grant select, update on table public.orders to authenticated; -- update only succeeds via is_admin policy

  if to_regclass('public.order_items') is not null then
    revoke insert, update, delete on table public.order_items from anon;
    revoke insert, update, delete on table public.order_items from authenticated;
    grant select on table public.order_items to authenticated;
  end if;

  if to_regclass('public.customers') is not null then
    revoke insert, update, delete on table public.customers from anon;
    revoke insert, update, delete on table public.customers from authenticated;
    grant select on table public.customers to authenticated;
  end if;

  -- Drop wide-open checkout insert policies if still present
  drop policy if exists "orders_insert_checkout" on public.orders;
  drop policy if exists "order_items_insert_checkout" on public.order_items;
  drop policy if exists "customers_insert_checkout" on public.customers;

  drop policy if exists "orders_select_own" on public.orders;
  create policy "orders_select_own"
    on public.orders
    for select
    to authenticated
    using (user_id is not null and user_id = auth.uid());

  drop policy if exists "orders_select_admin_role" on public.orders;
  create policy "orders_select_admin_role"
    on public.orders
    for select
    to authenticated
    using (public.is_admin());

  drop policy if exists "orders_update_admin_role" on public.orders;
  create policy "orders_update_admin_role"
    on public.orders
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

  if to_regclass('public.order_items') is not null then
    drop policy if exists "order_items_select_own" on public.order_items;
    create policy "order_items_select_own"
      on public.order_items
      for select
      to authenticated
      using (
        exists (
          select 1
            from public.orders o
           where o.id = order_items.order_id
             and o.user_id = auth.uid()
        )
      );

    drop policy if exists "order_items_select_admin_role" on public.order_items;
    create policy "order_items_select_admin_role"
      on public.order_items
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if to_regclass('public.customers') is not null then
    drop policy if exists "customers_select_admin_role" on public.customers;
    create policy "customers_select_admin_role"
      on public.customers
      for select
      to authenticated
      using (public.is_admin());
  end if;

  raise notice '[p0-lockdown] APPLIED orders RLS + revoked direct inserts';
end
$orders_rls$;

-- -----------------------------------------------------------------------------
-- 6) create_shop_order_with_stock — server price + stock FOR UPDATE
--    (based on coupon-shipping-policy-v1; ignores client unit_price/subtotal)
-- -----------------------------------------------------------------------------
do $checkout$
begin
  if to_regclass('public.products') is null or to_regclass('public.orders') is null then
    raise notice '[p0-lockdown] SKIP checkout RPC: products/orders missing';
    return;
  end if;

  execute $fn$
create or replace function public.create_shop_order_with_stock(
  p_customer_id uuid,
  p_customer jsonb,
  p_order_id uuid,
  p_order jsonb,
  p_items jsonb,
  p_member_coupon_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_stock integer;
  v_rows integer;
  v_user_id uuid;
  v_subtotal integer := 0;
  v_unit_price integer;
  v_line_total integer;
  v_product_name text;
  v_product_slug text;
  v_shipping_base constant integer := 4000;
  v_free_shipping_min constant integer := 70000;
  v_shipping_fee integer;
  v_coupon_discount integer := 0;
  v_total integer;
  v_coupon record;
  v_has_option_cols boolean := false;
  v_selected_color text;
  v_selected_size text;
  v_option_id text;
  v_max_qty constant integer := 99;
begin
  v_user_id := auth.uid();

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = 'P0001';
  end if;

  select exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'order_items'
       and column_name = 'selected_color'
  ) into v_has_option_cols;

  create temp table _shop_order_lines (
    product_id uuid not null,
    product_slug text,
    product_name text not null,
    quantity integer not null check (quantity > 0 and quantity <= 99),
    unit_price integer not null check (unit_price >= 0),
    total_price integer not null check (total_price >= 0),
    selected_color text,
    selected_size text,
    option_id text,
    check (total_price = unit_price * quantity)
  ) on commit drop;

  for item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_product_id := (item ->> 'product_id')::uuid;
    v_quantity := (item ->> 'quantity')::integer;
    v_selected_color := nullif(item ->> 'selected_color', '');
    v_selected_size := nullif(item ->> 'selected_size', '');
    v_option_id := nullif(item ->> 'option_id', '');

    if v_product_id is null then
      raise exception 'INVALID_PRODUCT' using errcode = 'P0001';
    end if;

    if v_quantity is null or v_quantity <= 0 or v_quantity > v_max_qty then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    -- Client unit_price / total_price / subtotal are intentionally ignored.
    select p.price, p.name, p.slug, p.stock
      into v_unit_price, v_product_name, v_product_slug, v_stock
      from public.products p
     where p.id = v_product_id
       and p.status = 'active'
     for update;

    if not found then
      raise exception 'PRODUCT_NOT_AVAILABLE' using errcode = 'P0001';
    end if;

    if v_stock < v_quantity then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
    end if;

    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into _shop_order_lines (
      product_id, product_slug, product_name, quantity, unit_price, total_price,
      selected_color, selected_size, option_id
    )
    values (
      v_product_id, v_product_slug, v_product_name, v_quantity, v_unit_price, v_line_total,
      v_selected_color, v_selected_size, v_option_id
    );
  end loop;

  if v_subtotal <= 0 then
    raise exception 'INVALID_SUBTOTAL' using errcode = 'P0001';
  end if;

  v_shipping_fee := case
    when v_subtotal >= v_free_shipping_min then 0
    else v_shipping_base
  end;

  if p_member_coupon_id is not null then
    if v_user_id is null then
      raise exception 'COUPON_REQUIRES_LOGIN' using errcode = 'P0001';
    end if;

    if to_regclass('public.member_coupons') is null or to_regclass('public.coupons') is null then
      raise exception 'COUPON_TABLES_MISSING' using errcode = 'P0001';
    end if;

    select c.discount_amount, c.min_order_amount, c.title
      into v_coupon
      from public.member_coupons mc
      inner join public.coupons c on c.id = mc.coupon_id
     where mc.id = p_member_coupon_id
       and mc.user_id = v_user_id
       and mc.is_used = false
       and c.is_active = true
       and (mc.expires_at is null or mc.expires_at > now())
     for update;

    if not found then
      raise exception 'INVALID_COUPON' using errcode = 'P0001';
    end if;

    if v_subtotal < v_coupon.min_order_amount then
      raise exception 'COUPON_MIN_ORDER_NOT_MET' using errcode = 'P0001';
    end if;

    v_coupon_discount := least(v_coupon.discount_amount, v_subtotal);
  end if;

  v_total := v_subtotal - v_coupon_discount + v_shipping_fee;

  if v_total <= 0 then
    raise exception 'INVALID_TOTAL' using errcode = 'P0001';
  end if;

  insert into public.customers (id, name, phone, zipcode, address1, address2)
  values (
    p_customer_id,
    p_customer ->> 'name',
    p_customer ->> 'phone',
    nullif(p_customer ->> 'zipcode', ''),
    nullif(p_customer ->> 'address1', ''),
    nullif(p_customer ->> 'address2', '')
  );

  insert into public.orders (
    id, order_number, customer_id, user_id,
    customer_name, customer_phone, customer_email,
    recipient_name, recipient_phone,
    zipcode, address1, address2, memo,
    depositor_name, payment_method,
    subtotal, coupon_discount_amount, shipping_fee, total_amount,
    payment_status, status, member_coupon_id
  )
  values (
    p_order_id,
    p_order ->> 'order_number',
    p_customer_id,
    v_user_id,
    p_order ->> 'customer_name',
    p_order ->> 'customer_phone',
    nullif(p_order ->> 'customer_email', ''),
    p_order ->> 'recipient_name',
    p_order ->> 'recipient_phone',
    nullif(p_order ->> 'zipcode', ''),
    nullif(p_order ->> 'address1', ''),
    nullif(p_order ->> 'address2', ''),
    nullif(p_order ->> 'memo', ''),
    p_order ->> 'depositor_name',
    coalesce(nullif(p_order ->> 'payment_method', ''), 'bank_transfer'),
    v_subtotal,
    v_coupon_discount,
    v_shipping_fee,
    v_total,
    'waiting_deposit',
    'pending_payment',
    p_member_coupon_id
  );

  if v_has_option_cols then
    insert into public.order_items (
      order_id, product_id, product_slug, product_name, quantity, unit_price, total_price,
      selected_color, selected_size, option_id
    )
    select
      p_order_id, product_id, product_slug, product_name, quantity, unit_price, total_price,
      selected_color, selected_size, option_id
      from _shop_order_lines;
  else
    insert into public.order_items (
      order_id, product_id, product_slug, product_name, quantity, unit_price, total_price
    )
    select
      p_order_id, product_id, product_slug, product_name, quantity, unit_price, total_price
      from _shop_order_lines;
  end if;

  for item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_product_id := (item ->> 'product_id')::uuid;
    v_quantity := (item ->> 'quantity')::integer;

    update public.products
       set stock = stock - v_quantity, updated_at = now()
     where id = v_product_id and stock >= v_quantity;

    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
    end if;
  end loop;

  if p_member_coupon_id is not null then
    update public.member_coupons
       set is_used = true, used_at = now()
     where id = p_member_coupon_id
       and user_id = v_user_id
       and is_used = false;

    if not found then
      raise exception 'COUPON_ALREADY_USED' using errcode = 'P0001';
    end if;
  end if;
end;
$body$;
  $fn$;

  comment on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) is
    'P0 lockdown checkout. Ignores client prices. Uses products.price + FOR UPDATE stock. Free ship >= 70000.';

  revoke all on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) from public;
  grant execute on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) to anon, authenticated;

  raise notice '[p0-lockdown] APPLIED create_shop_order_with_stock (server prices)';
end
$checkout$;

-- -----------------------------------------------------------------------------
-- 7) Banner / product storage: ensure anon cannot write (policy names from hardening)
-- -----------------------------------------------------------------------------
do $storage$
begin
  if to_regclass('storage.objects') is null then
    raise notice '[p0-lockdown] SKIP storage: storage.objects missing';
    return;
  end if;

  -- Drop overly broad authenticated write policies if present (legacy names)
  begin
    execute 'drop policy if exists "product_images_authenticated_insert" on storage.objects';
    execute 'drop policy if exists "product_images_authenticated_update" on storage.objects';
    execute 'drop policy if exists "product_images_authenticated_delete" on storage.objects';
    execute 'drop policy if exists "banner_images_authenticated_insert" on storage.objects';
    execute 'drop policy if exists "banner_images_authenticated_update" on storage.objects';
    execute 'drop policy if exists "banner_images_authenticated_delete" on storage.objects';
  exception
    when others then
      raise notice '[p0-lockdown] storage legacy policy drop skipped: %', sqlerrm;
  end;

  raise notice '[p0-lockdown] storage legacy broad write policies drop attempted — verify admin-only write policies from hardening-v3 remain';
end
$storage$;

-- -----------------------------------------------------------------------------
-- Done
-- -----------------------------------------------------------------------------
do $$
begin
  raise notice '[p0-lockdown] COMPLETE — run scripts/live-security-verification.mjs next';
  raise notice '[p0-lockdown] NEVER re-run files in supabase/legacy-sql-archive/';
end $$;
