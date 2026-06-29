-- =============================================================================
-- TWOTWOSHOP: Security hardening v3 (Critical C-01 ~ C-05, schema-safe)
-- =============================================================================
-- Safe to run on partial deployments: skips tables/buckets/RPCs that do not exist.
-- Use this file (NOT security-hardening-v2.sql).
--
-- Run AFTER: schema.sql, order-checkout-v2.sql, production-security-rls.sql
--
-- Targets (only when present in DB):
--   public.orders, order_items, customers, products, banners
--   storage.buckets: product-images, banner-images
--   function create_guest_order_with_stock (revoke only)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) Admin helper (idempotent)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- C-01) create_shop_order_with_stock — server price recalculation
-- -----------------------------------------------------------------------------
do $do$
begin
  if to_regclass('public.products') is null then
    raise notice '[security-hardening-v3] SKIP C-01: public.products does not exist';
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
  v_shipping_fee constant integer := 4000;
  v_coupon_discount integer := 0;
  v_total integer;
  v_coupon record;
begin
  v_user_id := auth.uid();

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = 'P0001';
  end if;

  create temp table _shop_order_lines (
    product_id uuid not null,
    product_slug text,
    product_name text not null,
    quantity integer not null check (quantity > 0),
    unit_price integer not null check (unit_price >= 0),
    total_price integer not null check (total_price >= 0),
    check (total_price = unit_price * quantity)
  ) on commit drop;

  for item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_product_id := (item ->> 'product_id')::uuid;
    v_quantity := (item ->> 'quantity')::integer;

    if v_product_id is null then
      raise exception 'INVALID_PRODUCT' using errcode = 'P0001';
    end if;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

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
      product_id, product_slug, product_name, quantity, unit_price, total_price
    )
    values (
      v_product_id, v_product_slug, v_product_name, v_quantity, v_unit_price, v_line_total
    );
  end loop;

  if v_subtotal <= 0 then
    raise exception 'INVALID_SUBTOTAL' using errcode = 'P0001';
  end if;

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

  insert into public.order_items (
    order_id, product_id, product_slug, product_name, quantity, unit_price, total_price
  )
  select
    p_order_id, product_id, product_slug, product_name, quantity, unit_price, total_price
  from _shop_order_lines;

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
     where id = p_member_coupon_id and user_id = v_user_id;
  end if;
end;
$body$;
  $fn$;

  comment on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) is
    'Checkout RPC. Prices/subtotal are computed from products.price — client price fields are ignored.';

  revoke all on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) from public;
  grant execute on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) to anon, authenticated;

  raise notice '[security-hardening-v3] APPLIED C-01: create_shop_order_with_stock';
end $do$;

-- Legacy RPC — revoke only if function exists
do $do$
begin
  if to_regprocedure('public.create_guest_order_with_stock(uuid,jsonb,uuid,jsonb,jsonb)') is not null then
    revoke all on function public.create_guest_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb) from public;
    raise notice '[security-hardening-v3] APPLIED: revoked create_guest_order_with_stock';
  else
    raise notice '[security-hardening-v3] SKIP: create_guest_order_with_stock not found';
  end if;
end $do$;

-- -----------------------------------------------------------------------------
-- C-02) orders / order_items / customers — RPC-only INSERT
-- -----------------------------------------------------------------------------
do $do$
begin
  if to_regclass('public.orders') is null then
    raise notice '[security-hardening-v3] SKIP C-02: public.orders does not exist';
    return;
  end if;

  alter table public.orders enable row level security;
  drop policy if exists "orders_insert_checkout" on public.orders;
  drop policy if exists "orders_insert_anon" on public.orders;
  revoke insert on table public.orders from anon, authenticated;

  raise notice '[security-hardening-v3] APPLIED C-02: public.orders';
end $do$;

do $do$
begin
  if to_regclass('public.order_items') is null then
    raise notice '[security-hardening-v3] SKIP C-02: public.order_items does not exist';
    return;
  end if;

  alter table public.order_items enable row level security;
  drop policy if exists "order_items_insert_checkout" on public.order_items;
  drop policy if exists "order_items_insert_anon" on public.order_items;
  revoke insert on table public.order_items from anon, authenticated;

  raise notice '[security-hardening-v3] APPLIED C-02: public.order_items';
end $do$;

do $do$
begin
  if to_regclass('public.customers') is null then
    raise notice '[security-hardening-v3] SKIP C-02: public.customers does not exist';
    return;
  end if;

  alter table public.customers enable row level security;
  drop policy if exists "customers_insert_checkout" on public.customers;
  drop policy if exists "customers_insert_anon" on public.customers;
  revoke insert on table public.customers from anon, authenticated;

  raise notice '[security-hardening-v3] APPLIED C-02: public.customers';
end $do$;

-- -----------------------------------------------------------------------------
-- C-03) banners — admin-only mutations (if table exists)
-- -----------------------------------------------------------------------------
do $do$
begin
  if to_regclass('public.banners') is null then
    raise notice '[security-hardening-v3] SKIP C-03: public.banners does not exist';
    return;
  end if;

  alter table public.banners enable row level security;

  revoke all on table public.banners from anon;
  revoke insert, update, delete on table public.banners from anon;
  grant select on table public.banners to anon, authenticated;
  grant insert, update, delete on table public.banners to authenticated;

  drop policy if exists "banners_select" on public.banners;
  drop policy if exists "banners_insert" on public.banners;
  drop policy if exists "banners_update" on public.banners;
  drop policy if exists "banners_delete" on public.banners;
  drop policy if exists "banners_select_storefront" on public.banners;
  drop policy if exists "banners_insert_admin_role" on public.banners;
  drop policy if exists "banners_update_admin_role" on public.banners;
  drop policy if exists "banners_delete_admin_role" on public.banners;

  create policy "banners_select_storefront"
    on public.banners for select to anon, authenticated
    using (is_active = true or public.is_admin());

  create policy "banners_insert_admin_role"
    on public.banners for insert to authenticated
    with check (public.is_admin());

  create policy "banners_update_admin_role"
    on public.banners for update to authenticated
    using (public.is_admin()) with check (public.is_admin());

  create policy "banners_delete_admin_role"
    on public.banners for delete to authenticated
    using (public.is_admin());

  raise notice '[security-hardening-v3] APPLIED C-03: public.banners';
end $do$;

-- -----------------------------------------------------------------------------
-- C-04) Storage — admin-only write per bucket (if bucket exists)
-- -----------------------------------------------------------------------------
do $do$
begin
  if not exists (select 1 from storage.buckets where id = 'product-images') then
    raise notice '[security-hardening-v3] SKIP C-04: storage bucket product-images not found';
    return;
  end if;

  drop policy if exists "Authenticated upload product images" on storage.objects;
  drop policy if exists "Authenticated update product images" on storage.objects;
  drop policy if exists "Authenticated delete product images" on storage.objects;
  drop policy if exists "product_images_insert_admin_role" on storage.objects;
  drop policy if exists "product_images_update_admin_role" on storage.objects;
  drop policy if exists "product_images_delete_admin_role" on storage.objects;

  create policy "product_images_insert_admin_role"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'product-images' and public.is_admin());

  create policy "product_images_update_admin_role"
    on storage.objects for update to authenticated
    using (bucket_id = 'product-images' and public.is_admin())
    with check (bucket_id = 'product-images' and public.is_admin());

  create policy "product_images_delete_admin_role"
    on storage.objects for delete to authenticated
    using (bucket_id = 'product-images' and public.is_admin());

  raise notice '[security-hardening-v3] APPLIED C-04: storage bucket product-images';
end $do$;

do $do$
begin
  if not exists (select 1 from storage.buckets where id = 'banner-images') then
    raise notice '[security-hardening-v3] SKIP C-04: storage bucket banner-images not found';
    return;
  end if;

  drop policy if exists "Authenticated upload banner images" on storage.objects;
  drop policy if exists "Authenticated update banner images" on storage.objects;
  drop policy if exists "Authenticated delete banner images" on storage.objects;
  drop policy if exists "banner_images_insert_admin_role" on storage.objects;
  drop policy if exists "banner_images_update_admin_role" on storage.objects;
  drop policy if exists "banner_images_delete_admin_role" on storage.objects;

  create policy "banner_images_insert_admin_role"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'banner-images' and public.is_admin());

  create policy "banner_images_update_admin_role"
    on storage.objects for update to authenticated
    using (bucket_id = 'banner-images' and public.is_admin())
    with check (bucket_id = 'banner-images' and public.is_admin());

  create policy "banner_images_delete_admin_role"
    on storage.objects for delete to authenticated
    using (bucket_id = 'banner-images' and public.is_admin());

  raise notice '[security-hardening-v3] APPLIED C-04: storage bucket banner-images';
end $do$;

-- -----------------------------------------------------------------------------
-- C-05) customers — remove permissive authenticated PII access
-- -----------------------------------------------------------------------------
do $do$
begin
  if to_regclass('public.customers') is null then
    raise notice '[security-hardening-v3] SKIP C-05: public.customers does not exist';
    return;
  end if;

  drop policy if exists "customers_select_authenticated" on public.customers;
  drop policy if exists "customers_update_admin_fields" on public.customers;
  drop policy if exists "customers_select_admin" on public.customers;

  revoke update on table public.customers from authenticated;

  drop policy if exists "customers_select_admin_role" on public.customers;
  create policy "customers_select_admin_role"
    on public.customers for select to authenticated
    using (public.is_admin());

  raise notice '[security-hardening-v3] APPLIED C-05: public.customers PII policies';
end $do$;

-- -----------------------------------------------------------------------------
-- Post-run: list hardened tables present in DB
-- -----------------------------------------------------------------------------
do $do$
declare
  r record;
begin
  raise notice '[security-hardening-v3] === public tables present ===';
  for r in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'orders', 'order_items', 'customers', 'products', 'banners',
        'coupons', 'member_coupons', 'customer_inquiries', 'customer_addresses'
      )
    order by c.relname
  loop
    raise notice '[security-hardening-v3]   - %', r.table_name;
  end loop;
end $do$;

-- =============================================================================
-- VERIFICATION (run manually)
-- =============================================================================
--
-- select tablename from pg_tables
-- where schemaname = 'public'
--   and tablename in ('orders','order_items','customers','banners','products')
-- order by tablename;
--
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'orders'
--   and grantee in ('anon','authenticated');
--
-- select oi.unit_price, p.price
-- from public.order_items oi
-- join public.products p on p.id = oi.product_id
-- where oi.order_id = '<ORDER_ID>';
--
-- =============================================================================
