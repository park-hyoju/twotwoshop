-- =============================================================================
-- TWOTWOSHOP: Admin Orders RLS (v0.9.1)
-- =============================================================================
-- 목적: 관리자 주문 목록 조회 및 상태 변경
-- 적용: schema.sql + fix-order-rls.sql 실행 후 SQL Editor에서 실행
-- 주의: v0.9.1은 Admin Auth 미구현 — anon SELECT/UPDATE 임시 허용
--       v0.9.2+ Admin 로그인 도입 시 authenticated role 정책으로 교체하세요.
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
  with check (true);
