-- =============================================================================
-- TWOTWOSHOP: Guest Checkout RLS / GRANT fix
-- =============================================================================
-- 문제: customers INSERT 후 RETURNING(SELECT) 또는 INSERT 정책/권한 누락 시
--       "new row violates row-level security policy" / 401 발생
--
-- 적용: Supabase SQL Editor에서 schema.sql 실행 후 이 파일을 실행하세요.
--       여러 번 실행해도 안전합니다 (idempotent).
-- =============================================================================

-- API 역할에 INSERT 권한 부여 (없으면 RLS 이전에 거부될 수 있음)
grant usage on schema public to anon, authenticated;

grant insert on table public.customers to anon, authenticated;
grant insert on table public.orders to anon, authenticated;
grant insert on table public.order_items to anon, authenticated;

-- RLS 활성화 (이미 켜져 있어도 무해)
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- customers: Guest 주문 시 insert만 허용 (SELECT 정책 없음 — 개인정보 보호)
drop policy if exists "customers_insert_anon" on public.customers;

create policy "customers_insert_anon"
  on public.customers
  for insert
  to anon, authenticated
  with check (true);

-- orders: Guest 주문 접수 insert만 허용
drop policy if exists "orders_insert_anon" on public.orders;

create policy "orders_insert_anon"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

-- order_items: 주문 상품 insert만 허용
drop policy if exists "order_items_insert_anon" on public.order_items;

create policy "order_items_insert_anon"
  on public.order_items
  for insert
  to anon, authenticated
  with check (true);
