-- =============================================================================
-- Admin post-migration fix (admintwotwo@twotwoshop.com)
-- =============================================================================
-- Run in Supabase SQL Editor after admin-login-id-migration.sql
--
-- Fixes:
-- 1) is_admin() — JWT claim + auth.users fallback (RLS for all admin pages)
-- 2) Ensure app_metadata.role = admin on new admin account
-- 3) Sync user_profiles row for admin user id
-- 4) Exclude @twotwoshop.com from customer login resolver
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) is_admin() — role-based only (no email check), with DB fallback
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
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

comment on function public.is_admin() is
  'True when JWT app_metadata.role = admin, with auth.users fallback by auth.uid().';

-- -----------------------------------------------------------------------------
-- 2) Ensure admin role on migrated account
-- -----------------------------------------------------------------------------
update auth.users
set
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin'),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where lower(email) = 'admintwotwo@twotwoshop.com'
  and coalesce(raw_app_meta_data->>'role', '') <> 'admin';

-- -----------------------------------------------------------------------------
-- 3) Sync admin user_profiles (optional row — does not affect admin RLS)
-- -----------------------------------------------------------------------------
insert into public.user_profiles (id, login_id, name, email, phone)
select
  u.id,
  'admintwotwo',
  coalesce(nullif(btrim(p.name), ''), '관리자'),
  u.email,
  p.phone
from auth.users u
left join public.user_profiles p on p.id = u.id
where lower(u.email) = 'admintwotwo@twotwoshop.com'
on conflict (id) do update
set
  login_id = coalesce(nullif(btrim(excluded.login_id), ''), public.user_profiles.login_id, 'admintwotwo'),
  email = excluded.email,
  name = coalesce(nullif(btrim(excluded.name), ''), public.user_profiles.name, '관리자'),
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 4) Customer login resolver — never return admin @twotwoshop.com emails
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
      and coalesce(u.raw_app_meta_data->>'role', '') <> 'admin'
      and lower(u.email) not like '%@twotwoshop.com'
    union
    select lower(u.email) as email
    from public.user_profiles p
    inner join auth.users u on u.id = p.id
    where lower(coalesce(p.login_id, '')) = lower(trim(p_identifier))
      and coalesce(u.raw_app_meta_data->>'role', '') <> 'admin'
      and lower(u.email) not like '%@twotwoshop.com'
    union
    select lower(u.email) as email
    from auth.users u
    where lower(coalesce(u.raw_user_meta_data->>'username', '')) = lower(trim(p_identifier))
      and coalesce(u.raw_app_meta_data->>'role', '') <> 'admin'
      and lower(u.email) not like '%@twotwoshop.com'
    union
    select lower(p.email) as email
    from public.user_profiles p
    inner join auth.users u on u.id = p.id
    where lower(p.email) like lower(trim(p_identifier)) || '@%'
      and coalesce(u.raw_app_meta_data->>'role', '') <> 'admin'
      and lower(u.email) not like '%@twotwoshop.com'
  ) as matched
  limit 1;
$$;

revoke all on function public.resolve_customer_login_email(text) from public;
grant execute on function public.resolve_customer_login_email(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5) Verify
-- -----------------------------------------------------------------------------
select id, email, raw_app_meta_data->>'role' as role, email_confirmed_at is not null as confirmed
from auth.users
where lower(email) in ('admintwotwo@twotwoshop.com', 'admin@twotwoshop.com');

select id, login_id, email from public.user_profiles
where lower(email) like '%@twotwoshop.com';
