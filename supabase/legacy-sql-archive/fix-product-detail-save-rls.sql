-- =============================================================================
-- !!! DO NOT RUN — LEGACY / DANGEROUS — ARCHIVED !!!
-- Re-executing this file can REOPEN anon/authenticated write access or
-- trust client checkout prices / profile-based admin escalation.
-- Use supabase/p0-security-lockdown.sql instead.
-- Archived: 2026-07-15
-- =============================================================================

-- =============================================================================
-- TWOTWOSHOP: Fix Product Detail Editor save (v0.9.3)
-- =============================================================================
-- 증상: Admin 상품 상세 저장 시 에러 없이 완료되지만 DB에 반영되지 않음
-- 원인: products 테이블에 anon UPDATE 권한 / RLS UPDATE 정책이 없어 0 rows updated
-- 해결: 이 파일 또는 admin-products-rls.sql 을 SQL Editor에서 실행
-- 특징: idempotent — 여러 번 실행해도 안전
-- =============================================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.products to anon, authenticated;

alter table public.products enable row level security;

drop policy if exists "products_select_admin" on public.products;

create policy "products_select_admin"
  on public.products
  for select
  to anon, authenticated
  using (true);

drop policy if exists "products_insert_admin" on public.products;

create policy "products_insert_admin"
  on public.products
  for insert
  to anon, authenticated
  with check (status in ('active', 'hidden', 'soldout'));

drop policy if exists "products_update_admin" on public.products;

create policy "products_update_admin"
  on public.products
  for update
  to anon, authenticated
  using (true)
  with check (status in ('active', 'hidden', 'soldout'));

drop policy if exists "products_delete_admin" on public.products;

create policy "products_delete_admin"
  on public.products
  for delete
  to anon, authenticated
  using (true);
