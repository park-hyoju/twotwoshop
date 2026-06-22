-- =============================================================================
-- TWOTWOSHOP: Fix Admin Orders SELECT (v0.9.5)
-- =============================================================================
-- 증상: checkout INSERT 성공, Supabase Table Editor에는 orders 행이 보이지만
--       /admin/orders 목록이 비어 있음 ("등록된 주문이 없습니다.")
--
-- 원인: schema.sql / fix-order-rls.sql 은 anon INSERT만 허용하고 SELECT는 막습니다.
--       admin-orders-rls.sql 이 적용되지 않으면 RLS가 SELECT를 0건으로 반환합니다.
--
-- 적용: Supabase Dashboard → SQL Editor 에서 이 파일 전체 실행
-- =============================================================================

grant usage on schema public to anon, authenticated;

grant select on table public.orders to anon, authenticated;
grant select on table public.order_items to anon, authenticated;
grant select on table public.customers to anon, authenticated;
grant update on table public.orders to anon, authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customers enable row level security;

drop policy if exists "orders_select_admin" on public.orders;

create policy "orders_select_admin"
  on public.orders
  for select
  to anon, authenticated
  using (true);

drop policy if exists "order_items_select_admin" on public.order_items;

create policy "order_items_select_admin"
  on public.order_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "customers_select_admin" on public.customers;

create policy "customers_select_admin"
  on public.customers
  for select
  to anon, authenticated
  using (true);

drop policy if exists "orders_update_admin" on public.orders;

create policy "orders_update_admin"
  on public.orders
  for update
  to anon, authenticated
  using (true)
  with check (
    status in ('pending', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled')
  );

-- Guest checkout INSERT policies (idempotent; fix-order-rls.sql 과 동일)
drop policy if exists "customers_insert_anon" on public.customers;

create policy "customers_insert_anon"
  on public.customers
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "orders_insert_anon" on public.orders;

create policy "orders_insert_anon"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "order_items_insert_anon" on public.order_items;

create policy "order_items_insert_anon"
  on public.order_items
  for insert
  to anon, authenticated
  with check (true);

grant insert on table public.customers to anon, authenticated;
grant insert on table public.orders to anon, authenticated;
grant insert on table public.order_items to anon, authenticated;
