-- =============================================================================
-- Admin orders security RLS — remove permissive anon policies + admin DELETE
-- =============================================================================
-- Run in Supabase SQL Editor after admin-route-guard.sql
--
-- Fixes:
-- 1) Drops legacy using(true) policies from admin-orders-rls.sql /
--    fix-admin-orders-select-rls.sql that expose orders to anon
-- 2) Admin-only SELECT / UPDATE / DELETE on orders & order_items
-- 3) Members retain SELECT on own orders only
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) is_admin() — JWT + auth.users + user_profiles.role (idempotent)
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
      select coalesce(u.raw_app_meta_data->>'role', '') = 'admin'
      from auth.users u
      where u.id = auth.uid()
    ),
    (
      select coalesce(p.role, '') = 'admin'
      from public.user_profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2) Revoke permissive anon access on orders / order_items / customers
-- -----------------------------------------------------------------------------
revoke all on table public.orders from anon;
revoke all on table public.order_items from anon;
revoke all on table public.customers from anon;

grant insert on table public.customers to anon, authenticated;
grant insert on table public.orders to anon, authenticated;
grant insert on table public.order_items to anon, authenticated;

grant select, update, delete on table public.orders to authenticated;
grant select, delete on table public.order_items to authenticated;
grant select on table public.customers to authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customers enable row level security;

-- -----------------------------------------------------------------------------
-- 3) Drop legacy permissive policies
-- -----------------------------------------------------------------------------
drop policy if exists "orders_select_admin" on public.orders;
drop policy if exists "order_items_select_admin" on public.order_items;
drop policy if exists "customers_select_admin" on public.customers;
drop policy if exists "orders_update_admin" on public.orders;

drop policy if exists "orders_select_admin_role" on public.orders;
drop policy if exists "orders_update_admin_role" on public.orders;
drop policy if exists "orders_delete_admin_role" on public.orders;
drop policy if exists "order_items_select_admin_role" on public.order_items;
drop policy if exists "order_items_delete_admin_role" on public.order_items;
drop policy if exists "customers_select_admin_role" on public.customers;

drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "order_items_select_own" on public.order_items;

drop policy if exists "orders_insert_anon" on public.orders;
drop policy if exists "order_items_insert_anon" on public.order_items;
drop policy if exists "customers_insert_anon" on public.customers;
drop policy if exists "orders_insert_checkout" on public.orders;
drop policy if exists "order_items_insert_checkout" on public.order_items;
drop policy if exists "customers_insert_checkout" on public.customers;

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

create policy "orders_delete_admin_role"
  on public.orders
  for delete
  to authenticated
  using (public.is_admin());

create policy "order_items_select_admin_role"
  on public.order_items
  for select
  to authenticated
  using (public.is_admin());

create policy "order_items_delete_admin_role"
  on public.order_items
  for delete
  to authenticated
  using (public.is_admin());

create policy "customers_select_admin_role"
  on public.customers
  for select
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4) Optional bulk reset RPC (admin only; order_items cascade on orders FK)
-- -----------------------------------------------------------------------------
create or replace function public.admin_delete_all_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  with deleted as (
    delete from public.orders returning id
  )
  select count(*)::integer into deleted_count from deleted;

  return deleted_count;
end;
$$;

revoke all on function public.admin_delete_all_orders() from public;
grant execute on function public.admin_delete_all_orders() to authenticated;

comment on function public.admin_delete_all_orders() is
  'Deletes all rows from public.orders (order_items cascade). Admin only.';
