-- =============================================================================
-- TWOTWOSHOP: security-hardening-v4-fix-consultation.sql
-- =============================================================================
-- Fixes H-06 consultation_status_settings — anon/member UPDATE must be blocked.
-- Run AFTER: consultation-status.sql, security-hardening-v3.sql, security-hardening-v4.sql
--
-- Root cause (typical):
--   - legacy consultation_status_settings_update_authenticated (using true) remains
--   - anon retained UPDATE table grant
--   - permissive policies not fully dropped
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) Admin helper (idempotent)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- H-06 FIX) consultation_status_settings — public SELECT, admin-only mutations
-- -----------------------------------------------------------------------------
do $do$
declare
  policy_record record;
begin
  if to_regclass('public.consultation_status_settings') is null then
    raise notice '[v4-fix-consultation] SKIP: table does not exist';
    return;
  end if;

  alter table public.consultation_status_settings enable row level security;
  alter table public.consultation_status_settings force row level security;

  -- Table privileges: anon = SELECT only; authenticated = mutations via RLS
  revoke all on table public.consultation_status_settings from anon;
  revoke all on table public.consultation_status_settings from authenticated;
  revoke all on table public.consultation_status_settings from public;

  grant select on table public.consultation_status_settings to anon, authenticated;
  grant insert, update, delete on table public.consultation_status_settings to authenticated;

  -- Drop every existing policy (quoted + unquoted legacy names)
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'consultation_status_settings'
  loop
    execute format(
      'drop policy if exists %I on public.consultation_status_settings',
      policy_record.policyname
    );
  end loop;

  drop policy if exists consultation_status_settings_select_all on public.consultation_status_settings;
  drop policy if exists consultation_status_settings_update_authenticated on public.consultation_status_settings;
  drop policy if exists "consultation_status_settings_select_all" on public.consultation_status_settings;
  drop policy if exists "consultation_status_settings_update_authenticated" on public.consultation_status_settings;
  drop policy if exists "consultation_status_settings_update_admin_role" on public.consultation_status_settings;
  drop policy if exists "consultation_status_settings_insert_admin_role" on public.consultation_status_settings;
  drop policy if exists "consultation_status_settings_delete_admin_role" on public.consultation_status_settings;

  -- SELECT: storefront + chat widget (anon + authenticated)
  create policy "consultation_status_settings_select_all"
    on public.consultation_status_settings
    for select
    to anon, authenticated
    using (true);

  -- INSERT / UPDATE / DELETE: admin JWT only
  create policy "consultation_status_settings_insert_admin_role"
    on public.consultation_status_settings
    for insert
    to authenticated
    with check (
      public.is_admin()
      and id = 'default'
      and status in ('available', 'away', 'busy', 'closed')
    );

  create policy "consultation_status_settings_update_admin_role"
    on public.consultation_status_settings
    for update
    to authenticated
    using (public.is_admin())
    with check (
      public.is_admin()
      and status in ('available', 'away', 'busy', 'closed')
    );

  create policy "consultation_status_settings_delete_admin_role"
    on public.consultation_status_settings
    for delete
    to authenticated
    using (public.is_admin());

  raise notice '[v4-fix-consultation] APPLIED: consultation_status_settings hardened';
end $do$;

-- =============================================================================
-- VERIFICATION — run after apply (see expected PASS below)
-- =============================================================================
--
-- -- 1) No permissive mutate policies
-- select policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'consultation_status_settings'
-- order by policyname;
--
-- -- 2) anon must NOT have UPDATE grant
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name = 'consultation_status_settings'
--   and grantee in ('anon', 'authenticated')
-- order by grantee, privilege_type;
--
-- Expected grants:
--   anon          → SELECT only
--   authenticated → SELECT, INSERT, UPDATE, DELETE (RLS filters mutations)
--
-- =============================================================================
