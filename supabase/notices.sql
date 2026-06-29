-- =============================================================================
-- TWOTWOSHOP: Notices (공지사항)
-- =============================================================================
-- 적용: schema.sql 실행 후 SQL Editor에서 실행
-- =============================================================================

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notices is
  '쇼핑몰 공지사항. 관리자가 작성·노출을 관리합니다.';

create index if not exists notices_active_pinned_created_idx
  on public.notices (is_active, is_pinned desc, created_at desc);

drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at
  before update on public.notices
  for each row
  execute function public.set_updated_at();

grant select, insert, update, delete on table public.notices to anon, authenticated;

alter table public.notices enable row level security;

drop policy if exists "notices_select" on public.notices;
create policy "notices_select"
  on public.notices
  for select
  to anon, authenticated
  using (true);

drop policy if exists "notices_insert" on public.notices;
create policy "notices_insert"
  on public.notices
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "notices_update" on public.notices;
create policy "notices_update"
  on public.notices
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "notices_delete" on public.notices;
create policy "notices_delete"
  on public.notices
  for delete
  to anon, authenticated
  using (true);
