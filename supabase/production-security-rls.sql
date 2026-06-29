-- =============================================================================
-- TWOTWOSHOP: Production security RLS (Critical fix)
-- =============================================================================
-- Removes permissive using(true) policies. Admin access requires JWT
-- app_metadata.role = 'admin'. Members see only own rows; anon cannot SELECT orders.
--
-- PREREQUISITE: Set admin user app_metadata in Dashboard:
--   Authentication → Users → admin → App Metadata → { "role": "admin" }
--
-- Run AFTER: schema.sql, fix-order-rls.sql, member-orders-fix.sql,
--            order-checkout-v2.sql, order-fulfillment.sql, inquiry-chat-system.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Admin role helper (JWT app_metadata.role)
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
-- 2) ORDERS / ORDER_ITEMS / CUSTOMERS
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

revoke all on table public.orders from anon;
revoke all on table public.order_items from anon;
revoke all on table public.customers from anon;

grant insert on table public.customers to anon, authenticated;
grant insert on table public.orders to anon, authenticated;
grant insert on table public.order_items to anon, authenticated;

grant select, update on table public.orders to authenticated;
grant select on table public.order_items to authenticated;
grant select on table public.customers to authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customers enable row level security;

-- Drop permissive / legacy policies
drop policy if exists "orders_select_admin" on public.orders;
drop policy if exists "order_items_select_admin" on public.order_items;
drop policy if exists "customers_select_admin" on public.customers;
drop policy if exists "orders_update_admin" on public.orders;

drop policy if exists "orders_select_admin_role" on public.orders;
drop policy if exists "orders_update_admin_role" on public.orders;
drop policy if exists "order_items_select_admin_role" on public.order_items;
drop policy if exists "customers_select_admin_role" on public.customers;

drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "order_items_select_own" on public.order_items;

drop policy if exists "orders_insert_anon" on public.orders;
drop policy if exists "order_items_insert_anon" on public.order_items;
drop policy if exists "customers_insert_anon" on public.customers;

-- Guest / member checkout insert (no SELECT for anon)
create policy "customers_insert_checkout"
  on public.customers
  for insert
  to anon, authenticated
  with check (true);

create policy "orders_insert_checkout"
  on public.orders
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy "order_items_insert_checkout"
  on public.order_items
  for insert
  to anon, authenticated
  with check (true);

-- Member: own orders only
create policy "orders_select_own"
  on public.orders
  for select
  to authenticated
  using (user_id is not null and user_id = auth.uid());

create policy "order_items_select_own"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id is not null
        and o.user_id = auth.uid()
    )
  );

-- Admin: full orders access
create policy "orders_select_admin_role"
  on public.orders
  for select
  to authenticated
  using (public.is_admin());

create policy "orders_update_admin_role"
  on public.orders
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "order_items_select_admin_role"
  on public.order_items
  for select
  to authenticated
  using (public.is_admin());

create policy "customers_select_admin_role"
  on public.customers
  for select
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3) PRODUCTS
-- -----------------------------------------------------------------------------
revoke all on table public.products from anon;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

alter table public.products enable row level security;

drop policy if exists "products_select_admin" on public.products;
drop policy if exists "products_insert_admin" on public.products;
drop policy if exists "products_update_admin" on public.products;
drop policy if exists "products_delete_admin" on public.products;
drop policy if exists "products_select_storefront" on public.products;
drop policy if exists "products_insert_admin_role" on public.products;
drop policy if exists "products_update_admin_role" on public.products;
drop policy if exists "products_delete_admin_role" on public.products;

create policy "products_select_storefront"
  on public.products
  for select
  to anon, authenticated
  using (status = 'active' or public.is_admin());

create policy "products_insert_admin_role"
  on public.products
  for insert
  to authenticated
  with check (
    public.is_admin()
    and status in ('active', 'hidden', 'soldout')
  );

create policy "products_update_admin_role"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (
    public.is_admin()
    and status in ('active', 'hidden', 'soldout')
  );

create policy "products_delete_admin_role"
  on public.products
  for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4) CUSTOMER INQUIRIES (direct table access: admin only; customers use RPC)
-- -----------------------------------------------------------------------------
alter table public.customer_inquiries enable row level security;
alter table public.customer_inquiry_messages enable row level security;

drop policy if exists "customer_inquiries_select_authenticated" on public.customer_inquiries;
drop policy if exists "customer_inquiries_update_authenticated" on public.customer_inquiries;
drop policy if exists "customer_inquiries_select_admin_role" on public.customer_inquiries;
drop policy if exists "customer_inquiries_update_admin_role" on public.customer_inquiries;
drop policy if exists "customer_inquiry_messages_select_authenticated" on public.customer_inquiry_messages;
drop policy if exists "customer_inquiry_messages_insert_authenticated" on public.customer_inquiry_messages;
drop policy if exists "customer_inquiry_messages_select_admin_role" on public.customer_inquiry_messages;
drop policy if exists "customer_inquiry_messages_insert_admin_role" on public.customer_inquiry_messages;

revoke all on table public.customer_inquiries from anon;
revoke all on table public.customer_inquiry_messages from anon;

grant insert on table public.customer_inquiries to authenticated;
grant select, update on table public.customer_inquiries to authenticated;
grant select, insert on table public.customer_inquiry_messages to authenticated;

create policy "customer_inquiries_select_admin_role"
  on public.customer_inquiries
  for select
  to authenticated
  using (public.is_admin());

create policy "customer_inquiries_update_admin_role"
  on public.customer_inquiries
  for update
  to authenticated
  using (public.is_admin())
  with check (
    public.is_admin()
    and status in ('pending', 'in_progress', 'answered', 'closed')
    and type in ('shipping', 'exchange', 'refund', 'product', 'other')
  );

create policy "customer_inquiry_messages_select_admin_role"
  on public.customer_inquiry_messages
  for select
  to authenticated
  using (public.is_admin());

create policy "customer_inquiry_messages_insert_admin_role"
  on public.customer_inquiry_messages
  for insert
  to authenticated
  with check (
    public.is_admin()
    and sender in ('customer', 'admin')
  );

comment on function public.is_admin() is
  'True when JWT app_metadata.role = admin. Required for admin RLS policies.';
