-- =============================================================================
-- Admin login ID migration: admin@twotwoshop.com → admintwotwo@twotwoshop.com
-- =============================================================================
-- Run in Supabase SQL Editor (requires service role / Dashboard SQL access).
--
-- Before: login with admin@twotwoshop.com (or legacy alias "admin")
-- After:  login with admintwotwo (→ admintwotwo@twotwoshop.com)
--
-- Option A — Rename existing auth user email (keeps same password & user id)
-- =============================================================================

-- 1) Preview current admin user
select id, email, email_confirmed_at, raw_app_meta_data
from auth.users
where lower(email) in ('admin@twotwoshop.com', 'admintwotwo@twotwoshop.com');

-- 2) Rename email (only when old account exists and new email is free)
update auth.users
set
  email = 'admintwotwo@twotwoshop.com',
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
  updated_at = now()
where lower(email) = 'admin@twotwoshop.com'
  and not exists (
    select 1 from auth.users u2 where lower(u2.email) = 'admintwotwo@twotwoshop.com'
  );

-- 3) Optional: sync user_profiles email if admin profile row exists
update public.user_profiles
set email = 'admintwotwo@twotwoshop.com',
    updated_at = now()
where lower(email) = 'admin@twotwoshop.com';

-- 4) Verify
select id, email, raw_app_meta_data->>'role' as role
from auth.users
where lower(email) = 'admintwotwo@twotwoshop.com';

-- =============================================================================
-- Option B — Create new admin user (Dashboard)
-- =============================================================================
-- Authentication → Users → Add user
--   Email: admintwotwo@twotwoshop.com
--   Password: (set new password)
--   Auto Confirm User: ON
-- App Metadata: { "role": "admin" }
--
-- Then delete old admin@twotwoshop.com user if no longer needed.
-- =============================================================================
