-- =============================================================================
-- TWOTWOSHOP: Admin account recovery (v0.9.4)
-- =============================================================================
-- Run sections in Supabase Dashboard → SQL Editor.
--
-- IMPORTANT (from src/lib/adminAuthConfig.ts):
--   Admin access requires JWT app_metadata.role = 'admin'
--   - NOT user_profiles.role
--   - NOT email string match alone
--   - Run supabase/production-security-rls.sql for matching RLS policies
--
-- Recovery = recreate auth.users row with email admin@twotwoshop.com
-- user_profiles row is NOT required for admin login.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- STEP 0: Diagnostics — run BEFORE recovery
-- -----------------------------------------------------------------------------

-- 0-1) Does the admin auth user still exist?
select
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data
from auth.users
where lower(email) = 'admin@twotwoshop.com';

-- 0-2) Orphaned user_profiles (admin row deleted via ON DELETE CASCADE)
--      If admin auth user was deleted, matching user_profiles row is also gone.
select id, email, name, created_at
from public.user_profiles
where lower(email) = 'admin@twotwoshop.com';

-- 0-3) Any profiles still pointing at missing auth users? (should be empty)
select p.id, p.email, p.name
from public.user_profiles p
left join auth.users u on u.id = p.id
where u.id is null;

-- 0-4) Admin-owned restock rows (user_id SET NULL on delete — data preserved)
select count(*) as admin_restock_rows
from public.restock_notifications rn
left join auth.users u on u.id = rn.user_id
where rn.user_id is not null and u.id is null;

-- 0-5) Business data is NOT tied to admin user id — should still exist
select
  (select count(*) from public.products) as products,
  (select count(*) from public.orders) as orders,
  (select count(*) from public.customer_inquiries) as inquiries;


-- -----------------------------------------------------------------------------
-- STEP 1: Recreate admin auth user (Dashboard — RECOMMENDED)
-- -----------------------------------------------------------------------------
-- Supabase does NOT support safe password hashing via plain SQL.
-- Use Dashboard instead:
--
--   Authentication → Users → Add user
--   Email:    admin@twotwoshop.com
--   Password: (choose a strong password)
--   ☑ Auto Confirm User
--
-- Login at /admin/login
--   Login ID: admin          (mapped to admin@twotwoshop.com)
--   or:       admin@twotwoshop.com
--
-- No app code changes required if email matches ADMIN_ALLOWED_EMAIL.


-- -----------------------------------------------------------------------------
-- STEP 2: Required — set admin role in app_metadata after Dashboard creation
-- -----------------------------------------------------------------------------
-- Replace <NEW_ADMIN_USER_UUID> with id from STEP 0-1 after recreation.
--
-- update auth.users
-- set
--   raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--     || jsonb_build_object('role', 'admin'),
--   raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
--     || jsonb_build_object('display_name', '관리자')
-- where id = '<NEW_ADMIN_USER_UUID>';


-- -----------------------------------------------------------------------------
-- STEP 3: Optional — user_profiles for admin (NOT required for /admin access)
-- -----------------------------------------------------------------------------
-- Admin pages do NOT read user_profiles for authorization.
-- Create only if you want a profile row for consistency.

-- insert into public.user_profiles (id, name, email)
-- select
--   u.id,
--   '관리자',
--   u.email
-- from auth.users u
-- where lower(u.email) = 'admin@twotwoshop.com'
-- on conflict (id) do update
-- set
--   name = excluded.name,
--   email = excluded.email,
--   updated_at = now();


-- -----------------------------------------------------------------------------
-- STEP 4: Verify after recovery
-- -----------------------------------------------------------------------------

-- 4-1) Auth user exists and is confirmed
select id, email, email_confirmed_at is not null as is_confirmed
from auth.users
where lower(email) = 'admin@twotwoshop.com';

-- 4-2) Expected: exactly 1 row, is_confirmed = true


-- -----------------------------------------------------------------------------
-- STEP 5: Post-recovery browser checklist
-- -----------------------------------------------------------------------------
-- 1. Clear stale session: DevTools → Application → Local Storage
--    → remove sb-<project-ref>-auth-token (or use incognito)
-- 2. /admin/login → admin + new password → /admin/dashboard
-- 3. /admin/products loads
-- 4. Log in as customer (testuser02@test.com) → /admin redirects to /admin/login
--    with "관리자 권한이 없습니다." only if they somehow used admin email on storefront
