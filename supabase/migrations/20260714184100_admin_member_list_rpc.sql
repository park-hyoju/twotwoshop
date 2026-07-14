-- =============================================================================
-- Admin member list RPC (read-only)
-- =============================================================================
-- NEW FILE ONLY — does not modify existing RLS policies, tables, or functions
-- other than creating admin_list_members.
--
-- Apply manually in Supabase SQL Editor after review.
-- Depends on: public.is_admin(), public.user_profiles, public.orders,
--             public.normalize_inquiry_phone (for phone fallback match).
-- =============================================================================

create or replace function public.admin_list_members()
returns table (
  id uuid,
  login_id text,
  name text,
  phone text,
  optional_email text,
  created_at timestamptz,
  has_order boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  return query
  select
    p.id,
    p.login_id,
    p.name,
    p.phone,
    p.optional_email,
    p.created_at,
    exists (
      select 1
      from public.orders o
      where o.user_id = p.id
         or (
           nullif(btrim(coalesce(p.phone, '')), '') is not null
           and public.normalize_inquiry_phone(o.customer_phone)
             = public.normalize_inquiry_phone(p.phone)
         )
    ) as has_order
  from public.user_profiles p
  order by p.created_at desc;
end;
$$;

revoke all on function public.admin_list_members() from public;
revoke all on function public.admin_list_members() from anon;
grant execute on function public.admin_list_members() to authenticated;

comment on function public.admin_list_members() is
  'Admin-only member list from user_profiles with order existence flag. Does not change user_profiles RLS.';
