-- =============================================================================
-- Admin notices security RLS — admin-only mutations
-- =============================================================================
-- Run in Supabase SQL Editor after admin-route-guard.sql
--
-- Fixes permissive notices.sql policies (anon insert/update/delete with true).
-- Storefront: active notices only. Admin: full CRUD via is_admin().
-- =============================================================================

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

create policy "notices_select_storefront"
  on public.notices
  for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

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
