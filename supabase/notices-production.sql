-- =============================================================================
-- TWOTWOSHOP: public.notices — table creation + admin-only RLS
-- =============================================================================
-- Run in Supabase SQL Editor (greenfield: table does not exist yet).
--
-- Prerequisites (run first if missing):
--   - supabase/schema.sql          → public.set_updated_at()
--   - supabase/admin-route-guard.sql → public.is_admin()
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) updated_at helper (idempotent)
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1) is_admin() — required for RLS (idempotent; full version in admin-route-guard.sql)
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
-- 2) notices table
-- -----------------------------------------------------------------------------
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  -- Admin UI 상단 고정 (is_pinned) — 기존 관리자 화면 호환
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notices is
  '쇼핑몰 공지사항. 관리자 작성·노출 관리. sort_order 오름차순, is_pinned 우선 정렬 권장.';

comment on column public.notices.sort_order is '목록 정렬 순서 (작을수록 앞).';
comment on column public.notices.is_pinned is 'true면 상단 고정 (관리자 UI).';

create index if not exists notices_active_sort_created_idx
  on public.notices (is_active, is_pinned desc, sort_order asc, created_at desc);

drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at
  before update on public.notices
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3) Grants + RLS (admin-only mutations)
-- -----------------------------------------------------------------------------
alter table public.notices enable row level security;

revoke all on table public.notices from anon;
grant select on table public.notices to anon, authenticated;
grant insert, update, delete on table public.notices to authenticated;

drop policy if exists "notices_select" on public.notices;
drop policy if exists "notices_insert" on public.notices;
drop policy if exists "notices_update" on public.notices;
drop policy if exists "notices_delete" on public.notices;
drop policy if exists "notices_select_storefront" on public.notices;
drop policy if exists "notices_insert_admin_role" on public.notices;
drop policy if exists "notices_update_admin_role" on public.notices;
drop policy if exists "notices_delete_admin_role" on public.notices;

-- Storefront / guest: active notices only
create policy "notices_select_storefront"
  on public.notices
  for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

-- Admin: insert / update / delete
create policy "notices_insert_admin_role"
  on public.notices
  for insert
  to authenticated
  with check (public.is_admin());

create policy "notices_update_admin_role"
  on public.notices
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "notices_delete_admin_role"
  on public.notices
  for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4) Verify
-- -----------------------------------------------------------------------------
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'notices'
order by ordinal_position;
