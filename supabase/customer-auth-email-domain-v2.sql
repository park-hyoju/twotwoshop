-- =============================================================================
-- Customer internal auth email domain: twotwoshop.local → twotwoshop.app
-- =============================================================================
-- Run if user-profiles-login-id.sql was already applied with @twotwoshop.local.
-- =============================================================================

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
