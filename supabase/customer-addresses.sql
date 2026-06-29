-- =============================================================================
-- TWOTWOSHOP: customer_addresses (배송지 관리)
-- =============================================================================
-- Run in Supabase SQL Editor when /mypage/addresses insert fails.
-- Requires: schema.sql (set_updated_at), user-profiles-rls.sql (optional)
-- =============================================================================

-- 1) Table
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null default '집',
  recipient_name text not null,
  phone text not null,
  zipcode text not null,
  address1 text not null,
  address2 text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_addresses_user_id_matches_auth check (user_id = auth.uid())
);

comment on table public.customer_addresses is
  '회원 저장 배송지. user_id는 auth.uid()와 일치해야 합니다.';

create index if not exists idx_customer_addresses_user_id
  on public.customer_addresses (user_id, created_at desc);

-- 2) updated_at trigger
drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;

create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
  for each row
  execute function public.set_updated_at();

-- 3) Single default address per user
create or replace function public.ensure_single_default_address()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.is_default then
    update public.customer_addresses
    set is_default = false,
        updated_at = now()
    where user_id = NEW.user_id
      and id is distinct from NEW.id
      and is_default = true;
  end if;

  return NEW;
end;
$$;

drop trigger if exists customer_addresses_default_trigger on public.customer_addresses;

create trigger customer_addresses_default_trigger
  before insert or update of is_default on public.customer_addresses
  for each row
  execute function public.ensure_single_default_address();

-- 4) RLS
alter table public.customer_addresses enable row level security;

grant usage on schema public to authenticated;
revoke all on table public.customer_addresses from anon, public;
grant select, insert, update, delete on table public.customer_addresses to authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_addresses'
  loop
    execute format('drop policy if exists %I on public.customer_addresses', policy_record.policyname);
  end loop;
end $$;

create policy "customer_addresses_select_own"
  on public.customer_addresses
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "customer_addresses_insert_own"
  on public.customer_addresses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "customer_addresses_update_own"
  on public.customer_addresses
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "customer_addresses_delete_own"
  on public.customer_addresses
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 5) Verify
-- select tablename from pg_tables where schemaname = 'public' and tablename = 'customer_addresses';
-- select policyname, cmd from pg_policies where tablename = 'customer_addresses';
