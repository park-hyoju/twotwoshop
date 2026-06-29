-- =============================================================================
-- TWOTWOSHOP: Security hardening v2 (Critical C-01 ~ C-05)
-- =============================================================================
-- DEPRECATED for partial DBs: use supabase/security-hardening-v3.sql instead.
-- v2 fails if public.notices (or other optional tables) do not exist.
--
-- Run in Supabase SQL Editor AFTER:
--   schema.sql, order-checkout-v2.sql, production-security-rls.sql,
--   banners.sql, notices.sql, product-images-storage.sql, banner-images-storage.sql
--
-- Fixes:
--   C-01  Server-side order price recalculation (create_shop_order_with_stock)
--   C-02  Remove direct INSERT on orders / order_items / customers
--   C-03  banners / notices — admin-only mutations
--   C-04  product-images / banner-images Storage — admin-only write
--   C-05  customers PII — drop permissive authenticated policies
--
-- Admin prerequisite: JWT app_metadata.role = 'admin'
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
as $$
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
      product_id,
      product_slug,
      product_name,
      quantity,
      unit_price,
      total_price
    )
    values (
      v_product_id,
      v_product_slug,
      v_product_name,
      v_quantity,
      v_unit_price,
      v_line_total
    );
  end loop;

  if v_subtotal <= 0 then
    raise exception 'INVALID_SUBTOTAL' using errcode = 'P0001';
  end if;

  if p_member_coupon_id is not null then
    if v_user_id is null then
      raise exception 'COUPON_REQUIRES_LOGIN' using errcode = 'P0001';
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
    order_id,
    product_id,
    product_slug,
    product_name,
    quantity,
    unit_price,
    total_price
  )
  select
    p_order_id,
    product_id,
    product_slug,
    product_name,
    quantity,
    unit_price,
    total_price
  from _shop_order_lines;

  for item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_product_id := (item ->> 'product_id')::uuid;
    v_quantity := (item ->> 'quantity')::integer;

    update public.products
       set stock = stock - v_quantity,
           updated_at = now()
     where id = v_product_id
       and stock >= v_quantity;

    get diagnostics v_rows = row_count;

    if v_rows = 0 then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
    end if;
  end loop;

  if p_member_coupon_id is not null then
    update public.member_coupons
       set is_used = true,
           used_at = now()
     where id = p_member_coupon_id
       and user_id = v_user_id;
  end if;
end;
$$;

comment on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) is
  'Checkout RPC. Prices/subtotal are computed from products.price — client price fields are ignored.';

revoke all on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) from public;
grant execute on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) to anon, authenticated;

-- Legacy RPC with client-trusted prices — disable public execution
revoke all on function public.create_guest_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb) from public;

-- -----------------------------------------------------------------------------
-- C-02) orders / order_items / customers — RPC-only INSERT
-- -----------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customers enable row level security;

drop policy if exists "orders_insert_checkout" on public.orders;
drop policy if exists "order_items_insert_checkout" on public.order_items;
drop policy if exists "customers_insert_checkout" on public.customers;
drop policy if exists "orders_insert_anon" on public.orders;
drop policy if exists "order_items_insert_anon" on public.order_items;
drop policy if exists "customers_insert_anon" on public.customers;

revoke insert on table public.orders from anon, authenticated;
revoke insert on table public.order_items from anon, authenticated;
revoke insert on table public.customers from anon, authenticated;

-- SELECT / UPDATE policies from production-security-rls.sql remain in effect.

-- -----------------------------------------------------------------------------
-- C-03) banners — storefront read, admin-only write
-- -----------------------------------------------------------------------------
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
  on public.banners
  for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "banners_insert_admin_role"
  on public.banners
  for insert
  to authenticated
  with check (public.is_admin());

create policy "banners_update_admin_role"
  on public.banners
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "banners_delete_admin_role"
  on public.banners
  for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- C-03) notices — storefront read, admin-only write
-- -----------------------------------------------------------------------------
alter table public.notices enable row level security;

revoke all on table public.notices from anon;
revoke insert, update, delete on table public.notices from anon;
grant select on table public.notices to anon, authenticated;
grant insert, update, delete on table public.notices to authenticated;

drop policy if exists "notices_select" on public.notices;
drop policy if exists "notices_insert" on public.notices;
drop policy if exists "notices_update" on public.notices;
drop policy if exists "notices_delete" on public.notices;
drop policy if exists "notices_select_storefront" on public.notices;
drop policy if exists "notices_insert_admin_role" on public.notices;
drop policy if exists "notices_update_admin_role" on public.notices;
drop policy if exists "notices_delete_admin_role" on public.notices;

create policy "notices_select_storefront"
  on public.notices
  for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "notices_insert_admin_role"
  on public.notices
  for insert
  to authenticated
  with check (public.is_admin());

create policy "notices_update_admin_role"
  on public.notices
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "notices_delete_admin_role"
  on public.notices
  for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- C-04) Storage — public read, admin-only write (product-images, banner-images)
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated upload product images" on storage.objects;
drop policy if exists "Authenticated update product images" on storage.objects;
drop policy if exists "Authenticated delete product images" on storage.objects;
drop policy if exists "product_images_insert_admin_role" on storage.objects;
drop policy if exists "product_images_update_admin_role" on storage.objects;
drop policy if exists "product_images_delete_admin_role" on storage.objects;

create policy "product_images_insert_admin_role"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_update_admin_role"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_delete_admin_role"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Authenticated upload banner images" on storage.objects;
drop policy if exists "Authenticated update banner images" on storage.objects;
drop policy if exists "Authenticated delete banner images" on storage.objects;
drop policy if exists "banner_images_insert_admin_role" on storage.objects;
drop policy if exists "banner_images_update_admin_role" on storage.objects;
drop policy if exists "banner_images_delete_admin_role" on storage.objects;

create policy "banner_images_insert_admin_role"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'banner-images' and public.is_admin());

create policy "banner_images_update_admin_role"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'banner-images' and public.is_admin())
  with check (bucket_id = 'banner-images' and public.is_admin());

create policy "banner_images_delete_admin_role"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'banner-images' and public.is_admin());

-- -----------------------------------------------------------------------------
-- C-05) customers — remove permissive authenticated PII access
-- -----------------------------------------------------------------------------
drop policy if exists "customers_select_authenticated" on public.customers;
drop policy if exists "customers_update_admin_fields" on public.customers;
drop policy if exists "customers_select_admin" on public.customers;

revoke update on table public.customers from authenticated;

drop policy if exists "customers_select_admin_role" on public.customers;
create policy "customers_select_admin_role"
  on public.customers
  for select
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- -- 1) Policies: no permissive true on critical tables
-- select tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('orders', 'order_items', 'customers', 'banners', 'notices')
-- order by tablename, policyname;
--
-- -- 2) orders INSERT revoked for anon
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'orders' and grantee in ('anon', 'authenticated');
--
-- -- 3) Storage write policies require is_admin
-- select policyname, roles, cmd, with_check
-- from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
--   and policyname like '%admin_role%';
--
-- -- 4) Price tamper test (replace UUIDs; expect INVALID_TOTAL or server price applied)
-- -- Call create_shop_order_with_stock with unit_price: 1 in p_items;
-- -- verify order_items.unit_price = products.price in DB after success.
--
-- select oi.product_id, oi.unit_price, p.price as catalog_price
-- from public.order_items oi
-- join public.products p on p.id = oi.product_id
-- where oi.order_id = '<ORDER_ID_FROM_TEST>';
--
-- =============================================================================
