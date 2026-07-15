-- =============================================================================
-- !!! DO NOT RUN — LEGACY / DANGEROUS — ARCHIVED !!!
-- Re-executing this file can REOPEN anon/authenticated write access or
-- trust client checkout prices / profile-based admin escalation.
-- Use supabase/p0-security-lockdown.sql instead.
-- Archived: 2026-07-15
-- =============================================================================

-- =============================================================================
-- TWOTWOSHOP: Admin Products RLS (v0.9.2)
-- =============================================================================
-- 목적: 관리자 상품 목록 조회·등록·수정·삭제
-- 적용: schema.sql 실행 후 SQL Editor에서 실행
-- 주의: v0.9.2는 Admin Auth 미구현 — anon CRUD 임시 허용
--       Admin 로그인 도입 후 authenticated role 정책으로 교체하세요.
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
