-- =============================================================================
-- user_profiles RLS fix (v2)
-- =============================================================================
-- Run in Supabase SQL Editor when profile upsert returns 403 / RLS violation.
--
-- App requirements:
-- - Client calls supabase.auth.getUser() before upsert
-- - upsert payload.id MUST equal auth.uid() (JWT sub claim)
-- - user_profiles.id references auth.users.id
-- =============================================================================

-- 1) Table + FK to auth.users
create table if not exists public.user_profiles (
  id uuid primary key,
  name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
  drop constraint if exists user_profiles_id_fkey;

alter table public.user_profiles
  add constraint user_profiles_id_fkey
  foreign key (id)
  references auth.users (id)
  on delete cascade;

-- 2) updated_at trigger (reuse shared helper if present)
drop trigger if exists user_profiles_set_updated_at on public.user_profiles;

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row
  execute function public.set_updated_at();

-- 3) RLS ON (never disable)
alter table public.user_profiles enable row level security;

-- 4) Privileges: authenticated only (no service_role, no anon writes)
revoke all on table public.user_profiles from anon;
revoke all on table public.user_profiles from public;

grant usage on schema public to authenticated;
grant select, insert, update on table public.user_profiles to authenticated;

-- 5) Drop ALL existing policies on user_profiles
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
  loop
    execute format('drop policy if exists %I on public.user_profiles', policy_record.policyname);
  end loop;
end $$;

-- 6) SELECT — own row only
create policy "user_profiles_select_own"
  on public.user_profiles
  as permissive
  for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = id);

-- 7) INSERT — own row only (upsert insert path)
create policy "user_profiles_insert_own"
  on public.user_profiles
  as permissive
  for insert
  to authenticated
  with check (auth.uid() is not null and auth.uid() = id);

-- 8) UPDATE — own row only (upsert on conflict update path)
create policy "user_profiles_update_own"
  on public.user_profiles
  as permissive
  for update
  to authenticated
  using (auth.uid() is not null and auth.uid() = id)
  with check (auth.uid() is not null and auth.uid() = id);

comment on table public.user_profiles is
  'Storefront member profile. id must match auth.users.id and auth.uid().';

-- =============================================================================
-- Verify (optional)
-- =============================================================================
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'user_profiles'
-- order by policyname;
--
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.user_profiles'::regclass;

-- -----------------------------------------------------------------------------
-- Login email resolver (username → auth email, pre-login safe)
-- -----------------------------------------------------------------------------
create or replace function public.resolve_customer_login_email(p_identifier text)
returns text
language sql
security definer
set search_path = public, auth
stable
as $$
  select matched.email
  from (
    select lower(u.email) as email
    from auth.users u
    where lower(u.email) = lower(trim(p_identifier))
    union
    select lower(p.email) as email
    from public.user_profiles p
    inner join auth.users u on u.id = p.id
    where lower(coalesce(u.raw_user_meta_data->>'username', '')) = lower(trim(p_identifier))
    union
    select lower(p.email) as email
    from public.user_profiles p
    where lower(p.email) like lower(trim(p_identifier)) || '@%'
  ) as matched
  limit 1;
$$;

revoke all on function public.resolve_customer_login_email(text) from public;
grant execute on function public.resolve_customer_login_email(text) to anon, authenticated;
