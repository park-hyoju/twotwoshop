-- =============================================================================
-- TWOTWOSHOP: Fix Admin Orders UPDATE (RLS + GRANT)
-- =============================================================================
-- 증상: 관리자 주문관리에서 입금확인/배송 상태 변경이 되지 않음
-- 원인: orders UPDATE RLS/GRANT 미적용 또는 WITH CHECK 제약
--
-- 적용: Supabase SQL Editor에서 실행 (fix-admin-orders-select-rls.sql 이후)
-- =============================================================================

grant usage on schema public to anon, authenticated;
grant update on table public.orders to anon, authenticated;

alter table public.orders enable row level security;

drop policy if exists "orders_update_admin" on public.orders;

create policy "orders_update_admin"
  on public.orders
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- status / payment_status CHECK 가 구버전이면 order-status-shipping-fix.sql 도 실행하세요.
