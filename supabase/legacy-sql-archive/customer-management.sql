-- =============================================================================
-- !!! DO NOT RUN — LEGACY / DANGEROUS — ARCHIVED !!!
-- Re-executing this file can REOPEN anon/authenticated write access or
-- trust client checkout prices / profile-based admin escalation.
-- Use supabase/p0-security-lockdown.sql instead.
-- Archived: 2026-07-15
-- =============================================================================

-- =============================================================================
-- TWOTWOSHOP: Customer Management MVP
-- =============================================================================
-- Run in Supabase SQL Editor after schema.sql / admin auth setup.
-- Adds admin fields to customers and restricts customer PII from anon reads.
-- =============================================================================

alter table public.customers
  add column if not exists email text,
  add column if not exists is_member boolean not null default false,
  add column if not exists admin_note text,
  add column if not exists customer_status text not null default 'normal';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customers_customer_status_check'
      and conrelid = 'public.customers'::regclass
  ) then
    alter table public.customers
      add constraint customers_customer_status_check
      check (customer_status in ('normal', 'caution', 'blocked'));
  end if;
end $$;

comment on column public.customers.email is
  '선택 이메일. 회원 연동 전까지 비회원 주문에서는 비어 있을 수 있습니다.';

comment on column public.customers.is_member is
  '회원 가입 여부. 로그인 기능 도입 전까지 기본값 false(비회원).';

comment on column public.customers.admin_note is
  '관리자 메모. 고객관리 화면에서만 조회/수정합니다.';

comment on column public.customers.customer_status is
  'normal=정상, caution=주의, blocked=차단';

create index if not exists idx_customers_phone on public.customers (phone);
create index if not exists idx_customers_customer_status on public.customers (customer_status);

alter table public.customers enable row level security;

-- Remove overly permissive customer SELECT for anon (PII protection)
drop policy if exists "customers_select_admin" on public.customers;

revoke select on table public.customers from anon;

grant select, update on table public.customers to authenticated;

drop policy if exists "customers_select_authenticated" on public.customers;

create policy "customers_select_authenticated"
  on public.customers
  for select
  to authenticated
  using (true);

drop policy if exists "customers_update_admin_fields" on public.customers;

create policy "customers_update_admin_fields"
  on public.customers
  for update
  to authenticated
  using (true)
  with check (customer_status in ('normal', 'caution', 'blocked'));

-- Guest checkout INSERT remains available (schema.sql / fix-order-rls.sql)
drop policy if exists "customers_insert_anon" on public.customers;

create policy "customers_insert_anon"
  on public.customers
  for insert
  to anon, authenticated
  with check (true);

grant insert on table public.customers to anon, authenticated;
