-- =============================================================================
-- user_profiles: login_id + optional_email (id-centric customer auth)
-- =============================================================================
-- Run in Supabase SQL Editor after user-profiles-rls.sql
-- =============================================================================

alter table public.user_profiles
  add column if not exists login_id text,
  add column if not exists optional_email text;

create unique index if not exists user_profiles_login_id_lower_idx
  on public.user_profiles (lower(login_id))
  where login_id is not null and btrim(login_id) <> '';

comment on column public.user_profiles.login_id is
  'Storefront login id (unique, case-insensitive).';

comment on column public.user_profiles.optional_email is
  'Optional contact email entered at signup.';

-- Backfill login_id from auth metadata / virtual auth email local-part
update public.user_profiles p
set login_id = coalesce(
  nullif(btrim(p.login_id), ''),
  nullif(btrim(u.raw_user_meta_data->>'username'), ''),
  nullif(split_part(lower(u.email), '@', 1), '')
)
from auth.users u
where u.id = p.id
  and (p.login_id is null or btrim(p.login_id) = '');

-- -----------------------------------------------------------------------------
-- Login email resolver (login id / legacy username / email → auth email)
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
    select lower(u.email) as email
    from public.user_profiles p
    inner join auth.users u on u.id = p.id
    where lower(coalesce(p.login_id, '')) = lower(trim(p_identifier))
    union
    select lower(u.email) as email
    from auth.users u
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

-- -----------------------------------------------------------------------------
-- Signup duplicate check (anon-safe)
-- -----------------------------------------------------------------------------
create or replace function public.is_login_id_available(p_login_id text)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select not exists (
    select 1
    from public.user_profiles p
    where lower(coalesce(p.login_id, '')) = lower(trim(p_login_id))
  )
  and not exists (
    select 1
    from auth.users u
    where lower(u.email) = lower(trim(p_login_id)) || '@twotwoshop.app'
       or lower(u.email) = lower(trim(p_login_id)) || '@twotwoshop.local'
       or lower(u.email) = lower(trim(p_login_id)) || '@example.com'
       or lower(coalesce(u.raw_user_meta_data->>'username', '')) = lower(trim(p_login_id))
  );
$$;

revoke all on function public.is_login_id_available(text) from public;
grant execute on function public.is_login_id_available(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Password reset delivery email (optional_email when auth email is virtual)
-- -----------------------------------------------------------------------------
create or replace function public.resolve_customer_password_reset_email(p_identifier text)
returns text
language sql
security definer
set search_path = public, auth
stable
as $$
  select coalesce(
    (
      select lower(nullif(btrim(p.optional_email), ''))
      from public.user_profiles p
      where lower(coalesce(p.login_id, '')) = lower(trim(p_identifier))
         or lower(coalesce(p.email, '')) = lower(trim(p_identifier))
      limit 1
    ),
    case
      when position('@' in trim(p_identifier)) > 0
        and lower(trim(p_identifier)) not like '%@twotwoshop.app'
        and lower(trim(p_identifier)) not like '%@twotwoshop.local'
        and lower(trim(p_identifier)) not like '%@example.com'
      then lower(trim(p_identifier))
      else null
    end
  );
$$;

revoke all on function public.resolve_customer_password_reset_email(text) from public;
grant execute on function public.resolve_customer_password_reset_email(text) to anon, authenticated;
