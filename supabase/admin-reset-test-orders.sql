-- =============================================================================
-- TWOTWOSHOP: Admin test-order reset (P0-safe)
-- =============================================================================
-- Run in Supabase SQL Editor AFTER p0-security-lockdown.sql
--
-- Does NOT open RLS. Uses SECURITY DEFINER + public.is_admin() gate only.
-- Does NOT grant DELETE on orders/order_items/customers to anon/authenticated.
--
-- Test orders matched (real TT-YYYYMMDD-* orders are NEVER touched):
--   - order_number ILIKE 'P0-FORGE-%'   (security probe)
--   - order_number ILIKE 'HARDENING-%'  (RLS verification scripts)
--   - customer_name = 'P0 Security Probe'
--
-- Full wipe requires admin_delete_all_orders_confirmed('전체 주문 영구 삭제').
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: is this row a known test order?
-- -----------------------------------------------------------------------------
create or replace function public._is_test_order_row(
  p_order_number text,
  p_customer_name text
)
returns boolean
language sql
immutable
as $$
  select coalesce(
    p_order_number ilike 'P0-FORGE-%'
    or p_order_number ilike 'HARDENING-%'
    or btrim(coalesce(p_customer_name, '')) = 'P0 Security Probe',
    false
  );
$$;

revoke all on function public._is_test_order_row(text, text) from public;

comment on function public._is_test_order_row(text, text) is
  'Internal helper: true for security/QA probe orders only. Not for client use.';

-- -----------------------------------------------------------------------------
-- admin_reset_test_orders — delete matched test orders only
-- -----------------------------------------------------------------------------
create or replace function public.admin_reset_test_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_orders integer := 0;
  v_target_ids uuid[];
  v_customer_ids uuid[];
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED'
      using errcode = '42501',
            hint = 'JWT app_metadata.role must be admin';
  end if;

  select coalesce(array_agg(o.id), '{}'::uuid[])
    into v_target_ids
    from public.orders o
   where public._is_test_order_row(o.order_number, o.customer_name);

  if array_length(v_target_ids, 1) is null then
    return 0;
  end if;

  select coalesce(array_agg(distinct o.customer_id), '{}'::uuid[])
    into v_customer_ids
    from public.orders o
   where o.id = any (v_target_ids)
     and o.customer_id is not null;

  -- FK-safe order: order_items → orders → orphan customers
  delete from public.order_items
   where order_id = any (v_target_ids);

  with deleted as (
    delete from public.orders
     where id = any (v_target_ids)
     returning id
  )
  select count(*)::integer into v_deleted_orders from deleted;

  if array_length(v_customer_ids, 1) is not null then
    delete from public.customers c
     where c.id = any (v_customer_ids)
       and not exists (
         select 1
           from public.orders o
          where o.customer_id = c.id
       );
  end if;

  return v_deleted_orders;
end;
$$;

revoke all on function public.admin_reset_test_orders() from public;
revoke all on function public.admin_reset_test_orders() from anon;
grant execute on function public.admin_reset_test_orders() to authenticated;

comment on function public.admin_reset_test_orders() is
  'Admin only. Deletes probe/test orders (P0-FORGE-*, HARDENING-*, P0 Security Probe). Never deletes TT-* production numbers.';

-- -----------------------------------------------------------------------------
-- admin_delete_all_orders_confirmed — full wipe (dangerous, phrase-gated)
-- -----------------------------------------------------------------------------
create or replace function public.admin_delete_all_orders_confirmed(p_confirmation text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_orders integer := 0;
  v_all_customer_ids uuid[];
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED'
      using errcode = '42501',
            hint = 'JWT app_metadata.role must be admin';
  end if;

  if btrim(coalesce(p_confirmation, '')) is distinct from '전체 주문 영구 삭제' then
    raise exception 'CONFIRMATION_REQUIRED'
      using errcode = 'P0001',
            hint = 'Type exactly: 전체 주문 영구 삭제';
  end if;

  select coalesce(array_agg(distinct o.customer_id), '{}'::uuid[])
    into v_all_customer_ids
    from public.orders o
   where o.customer_id is not null;

  delete from public.order_items
   where order_id in (select id from public.orders);

  with deleted as (
    delete from public.orders returning id
  )
  select count(*)::integer into v_deleted_orders from deleted;

  if array_length(v_all_customer_ids, 1) is not null then
    delete from public.customers c
     where c.id = any (v_all_customer_ids)
       and not exists (
         select 1 from public.orders o where o.customer_id = c.id
       );
  end if;

  return v_deleted_orders;
end;
$$;

revoke all on function public.admin_delete_all_orders_confirmed(text) from public;
revoke all on function public.admin_delete_all_orders_confirmed(text) from anon;
grant execute on function public.admin_delete_all_orders_confirmed(text) to authenticated;

comment on function public.admin_delete_all_orders_confirmed(text) is
  'Admin only. Deletes ALL orders after exact confirmation phrase. Use only in empty/staging shops.';

-- -----------------------------------------------------------------------------
-- Deprecate legacy admin_delete_all_orders (no phrase gate)
-- -----------------------------------------------------------------------------
create or replace function public.admin_delete_all_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'DEPRECATED_RPC'
    using errcode = 'P0001',
          hint = 'Use admin_reset_test_orders() or admin_delete_all_orders_confirmed(text)';
end;
$$;

revoke all on function public.admin_delete_all_orders() from public;
revoke all on function public.admin_delete_all_orders() from anon;
grant execute on function public.admin_delete_all_orders() to authenticated;

comment on function public.admin_delete_all_orders() is
  'DEPRECATED. Replaced by admin_reset_test_orders and admin_delete_all_orders_confirmed.';

do $$
begin
  raise notice '[admin-reset-test-orders] APPLIED — test reset + confirmed full wipe RPCs ready';
end $$;
