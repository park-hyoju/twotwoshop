-- =============================================================================
-- TWOTWOSHOP: Security hardening v4 (post-v3 residual Critical/High fixes)
-- =============================================================================
-- Run AFTER: security-hardening-v3.sql
--
-- Fixes:
--   C-06  create_guest_order_with_stock — drop + revoke anon/authenticated
--   H-01  mark_admin_inquiry_read — is_admin() gate + revoke anon
--   C-03  product_related — storefront SELECT, admin-only mutations
--   H-02  restock_notifications — admin full access, member own-row SELECT only
--   H-03  customer_inquiries DELETE — admin only
--   H-06  consultation_status_settings — public SELECT, admin-only UPDATE
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
-- C-06) Legacy guest order RPC — complete removal
-- -----------------------------------------------------------------------------
do $do$
begin
  if to_regprocedure('public.create_guest_order_with_stock(uuid,jsonb,uuid,jsonb,jsonb)') is null then
    raise notice '[security-hardening-v4] SKIP C-06: create_guest_order_with_stock not found';
    return;
  end if;

  revoke all on function public.create_guest_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb)
    from public, anon, authenticated;

  drop function public.create_guest_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb);

  raise notice '[security-hardening-v4] APPLIED C-06: dropped create_guest_order_with_stock';
end $do$;

-- -----------------------------------------------------------------------------
-- H-01) mark_admin_inquiry_read — admin gate + anon blocked
-- -----------------------------------------------------------------------------
do $do$
begin
  if to_regprocedure('public.mark_admin_inquiry_read(uuid)') is null then
    raise notice '[security-hardening-v4] SKIP H-01: mark_admin_inquiry_read not found';
    return;
  end if;

  execute $fn$
create or replace function public.mark_admin_inquiry_read(p_inquiry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $body$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = 'P0001';
  end if;

  update public.customer_inquiries
  set admin_read_at = now(),
      admin_unread_count = 0
  where id = p_inquiry_id;
end;
$body$;
  $fn$;

  revoke all on function public.mark_admin_inquiry_read(uuid) from public, anon, authenticated;
  grant execute on function public.mark_admin_inquiry_read(uuid) to authenticated;

  raise notice '[security-hardening-v4] APPLIED H-01: mark_admin_inquiry_read admin-gated';
end $do$;

-- -----------------------------------------------------------------------------
-- C-03) product_related — storefront read, admin-only write
-- -----------------------------------------------------------------------------
do $do$
begin
  if to_regclass('public.product_related') is null then
    raise notice '[security-hardening-v4] SKIP C-03: public.product_related does not exist';
    return;
  end if;

  alter table public.product_related enable row level security;

  revoke all on table public.product_related from anon;
  grant select on table public.product_related to anon, authenticated;
  grant insert, update, delete on table public.product_related to authenticated;

  drop policy if exists "product_related_select" on public.product_related;
  drop policy if exists "product_related_insert" on public.product_related;
  drop policy if exists "product_related_update" on public.product_related;
  drop policy if exists "product_related_delete" on public.product_related;
  drop policy if exists "product_related_select_storefront" on public.product_related;
  drop policy if exists "product_related_insert_admin_role" on public.product_related;
  drop policy if exists "product_related_update_admin_role" on public.product_related;
  drop policy if exists "product_related_delete_admin_role" on public.product_related;

  create policy "product_related_select_storefront"
    on public.product_related for select to anon, authenticated
    using (true);

  create policy "product_related_insert_admin_role"
    on public.product_related for insert to authenticated
    with check (public.is_admin());

  create policy "product_related_update_admin_role"
    on public.product_related for update to authenticated
    using (public.is_admin()) with check (public.is_admin());

  create policy "product_related_delete_admin_role"
    on public.product_related for delete to authenticated
    using (public.is_admin());

  raise notice '[security-hardening-v4] APPLIED C-03: public.product_related';
end $do$;

-- -----------------------------------------------------------------------------
-- H-02) restock_notifications — admin full, member own SELECT only
-- -----------------------------------------------------------------------------
do $do$
begin
  if to_regclass('public.restock_notifications') is null then
    raise notice '[security-hardening-v4] SKIP H-02: public.restock_notifications does not exist';
    return;
  end if;

  alter table public.restock_notifications enable row level security;

  revoke update on table public.restock_notifications from authenticated;

  drop policy if exists "restock_notifications_select_admin" on public.restock_notifications;
  drop policy if exists "restock_notifications_update_admin" on public.restock_notifications;
  drop policy if exists "restock_notifications_select_admin_role" on public.restock_notifications;
  drop policy if exists "restock_notifications_update_admin_role" on public.restock_notifications;
  drop policy if exists "restock_notifications_select_own" on public.restock_notifications;

  create policy "restock_notifications_select_admin_role"
    on public.restock_notifications for select to authenticated
    using (public.is_admin());

  create policy "restock_notifications_select_own"
    on public.restock_notifications for select to authenticated
    using (user_id = auth.uid());

  create policy "restock_notifications_update_admin_role"
    on public.restock_notifications for update to authenticated
    using (public.is_admin()) with check (public.is_admin());

  raise notice '[security-hardening-v4] APPLIED H-02: public.restock_notifications';
end $do$;

-- -----------------------------------------------------------------------------
-- H-03) customer_inquiries DELETE — admin only
-- -----------------------------------------------------------------------------
do $do$
begin
  if to_regclass('public.customer_inquiries') is null then
    raise notice '[security-hardening-v4] SKIP H-03: public.customer_inquiries does not exist';
    return;
  end if;

  drop policy if exists "customer_inquiries_delete_authenticated" on public.customer_inquiries;
  drop policy if exists "customer_inquiries_delete_admin_role" on public.customer_inquiries;

  create policy "customer_inquiries_delete_admin_role"
    on public.customer_inquiries for delete to authenticated
    using (public.is_admin());

  raise notice '[security-hardening-v4] APPLIED H-03: customer_inquiries delete admin-only';
end $do$;

-- -----------------------------------------------------------------------------
-- H-06) consultation_status_settings — public read, admin update
-- -----------------------------------------------------------------------------
do $do$
begin
  if to_regclass('public.consultation_status_settings') is null then
    raise notice '[security-hardening-v4] SKIP H-06: public.consultation_status_settings does not exist';
    return;
  end if;

  alter table public.consultation_status_settings enable row level security;

  grant select on table public.consultation_status_settings to anon, authenticated;
  grant update on table public.consultation_status_settings to authenticated;

  drop policy if exists "consultation_status_settings_select_all" on public.consultation_status_settings;
  drop policy if exists "consultation_status_settings_update_authenticated" on public.consultation_status_settings;
  drop policy if exists "consultation_status_settings_update_admin_role" on public.consultation_status_settings;

  create policy "consultation_status_settings_select_all"
    on public.consultation_status_settings for select to anon, authenticated
    using (true);

  create policy "consultation_status_settings_update_admin_role"
    on public.consultation_status_settings for update to authenticated
    using (public.is_admin())
    with check (
      public.is_admin()
      and status in ('available', 'away', 'busy', 'closed')
    );

  raise notice '[security-hardening-v4] APPLIED H-06: consultation_status_settings';
end $do$;

-- =============================================================================
-- VERIFICATION (run manually after apply)
-- =============================================================================
--
-- -- C-06: function gone
-- select proname from pg_proc
-- where pronamespace = 'public'::regnamespace
--   and proname = 'create_guest_order_with_stock';
--
-- -- Permissive policies removed
-- select tablename, policyname, cmd, qual, with_check from pg_policies
-- where schemaname = 'public'
--   and tablename in (
--     'product_related', 'restock_notifications',
--     'customer_inquiries', 'consultation_status_settings'
--   )
-- order by tablename, policyname;
--
-- =============================================================================
