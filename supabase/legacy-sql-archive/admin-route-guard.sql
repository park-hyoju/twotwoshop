-- =============================================================================
-- !!! DO NOT RUN — LEGACY / DANGEROUS — ARCHIVED !!!
-- Re-executing this file can REOPEN anon/authenticated write access or
-- trust client checkout prices / profile-based admin escalation.
-- Use supabase/p0-security-lockdown.sql instead.
-- Archived: 2026-07-15
-- =============================================================================

-- =============================================================================
-- Admin route guard — user_profiles.role fallback for is_admin()
-- =============================================================================
-- Run in Supabase SQL Editor after admin-fix-post-migration.sql
--
-- Frontend checks app_metadata.role OR user_profiles.role = 'admin'.
-- RLS is_admin() also accepts profile role when JWT claim is stale.
-- =============================================================================

alter table public.user_profiles
  add column if not exists role text;

comment on column public.user_profiles.role is
  'Optional admin marker. When ''admin'', grants admin access with app_metadata.role.';

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

update public.user_profiles p
set role = 'admin', updated_at = now()
from auth.users u
where p.id = u.id
  and coalesce(u.raw_app_meta_data->>'role', '') = 'admin'
  and coalesce(p.role, '') <> 'admin';

update public.user_profiles p
set role = 'admin', updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = 'admintwotwo@twotwoshop.com'
  and coalesce(p.role, '') <> 'admin';
