-- =============================================================================
-- TWOTWOSHOP: Main banners (admin-managed hero carousel)
-- =============================================================================
-- 적용: schema.sql 실행 후 SQL Editor에서 실행
-- Storage: banner-images-storage.sql 도 함께 실행하세요.
-- =============================================================================

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  button_text text not null default '',
  button_link text not null default '/products',
  desktop_image text,
  mobile_image text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.banners is
  '메인 페이지 히어로 배너. 관리자가 등록·순서·노출을 관리합니다.';

create index if not exists banners_active_sort_idx
  on public.banners (is_active, sort_order, created_at);

drop trigger if exists banners_set_updated_at on public.banners;
create trigger banners_set_updated_at
  before update on public.banners
  for each row
  execute function public.set_updated_at();

grant select, insert, update, delete on table public.banners to anon, authenticated;

alter table public.banners enable row level security;

drop policy if exists "banners_select" on public.banners;
create policy "banners_select"
  on public.banners
  for select
  to anon, authenticated
  using (true);

drop policy if exists "banners_insert" on public.banners;
create policy "banners_insert"
  on public.banners
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "banners_update" on public.banners;
create policy "banners_update"
  on public.banners
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "banners_delete" on public.banners;
create policy "banners_delete"
  on public.banners
  for delete
  to anon, authenticated
  using (true);
