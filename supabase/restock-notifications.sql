-- =============================================================================
-- Restock notifications + customer profiles
-- =============================================================================
-- Run after schema.sql and product-category-stock.sql
-- =============================================================================

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_profiles is
  '쇼핑몰 회원 프로필. auth.users 와 1:1 매핑.';

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row
  execute function public.set_updated_at();

create table if not exists public.restock_notifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  customer_name text,
  phone text,
  email text,
  is_notified boolean not null default false,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  constraint restock_notifications_member_or_guest_check check (
    user_id is not null
    or (customer_name is not null and phone is not null)
  )
);

comment on table public.restock_notifications is
  '재입고 알림 신청. 회원(user_id) 또는 비회원(phone) 기준으로 중복 방지.';

create unique index if not exists restock_notifications_member_unique_idx
  on public.restock_notifications (product_id, user_id)
  where user_id is not null;

create unique index if not exists restock_notifications_guest_unique_idx
  on public.restock_notifications (product_id, phone)
  where user_id is null and phone is not null;

create index if not exists idx_restock_notifications_product_id
  on public.restock_notifications (product_id);

create index if not exists idx_restock_notifications_created_at
  on public.restock_notifications (created_at desc);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.user_profiles enable row level security;
alter table public.restock_notifications enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on table public.user_profiles to authenticated;
grant insert on table public.restock_notifications to anon, authenticated;
grant select, update on table public.restock_notifications to authenticated;

-- Drop all existing user_profiles policies before recreating (idempotent fix)
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
  loop
    execute format('drop policy if exists %I on public.user_profiles', policy_record.policyname);
  end loop;
end $$;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
  on public.user_profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
  on public.user_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
  on public.user_profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "restock_notifications_select_admin" on public.restock_notifications;
create policy "restock_notifications_select_admin"
  on public.restock_notifications
  for select
  to authenticated
  using (true);

drop policy if exists "restock_notifications_update_admin" on public.restock_notifications;
create policy "restock_notifications_update_admin"
  on public.restock_notifications
  for update
  to authenticated
  using (true)
  with check (true);

-- 고객 화면에서는 신청자 목록 조회 불가 (SELECT 정책 없음)

-- -----------------------------------------------------------------------------
-- RPC: 회원 재입고 알림 신청
-- -----------------------------------------------------------------------------
create or replace function public.subscribe_restock_notification_member(
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_name text;
  v_phone text;
  v_email text;
  v_existing_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.products
    where id = p_product_id
  ) then
    raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0001';
  end if;

  select name, phone, email
    into v_name, v_phone, v_email
    from public.user_profiles
   where id = v_user_id;

  select coalesce(v_email, u.email)
    into v_email
    from auth.users u
   where u.id = v_user_id;

  select id
    into v_existing_id
    from public.restock_notifications
   where product_id = p_product_id
     and user_id = v_user_id
   limit 1;

  if v_existing_id is not null then
    return jsonb_build_object('status', 'already_subscribed');
  end if;

  insert into public.restock_notifications (
    product_id,
    user_id,
    customer_name,
    phone,
    email
  )
  values (
    p_product_id,
    v_user_id,
    nullif(trim(v_name), ''),
    nullif(trim(v_phone), ''),
    nullif(trim(v_email), '')
  );

  return jsonb_build_object('status', 'created');
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: 비회원 재입고 알림 신청
-- -----------------------------------------------------------------------------
create or replace function public.subscribe_restock_notification_guest(
  p_product_id uuid,
  p_customer_name text,
  p_phone text,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_phone text;
  v_email text;
  v_existing_id uuid;
begin
  v_name := trim(coalesce(p_customer_name, ''));
  v_phone := regexp_replace(trim(coalesce(p_phone, '')), '[^0-9]', '', 'g');
  v_email := nullif(trim(coalesce(p_email, '')), '');

  if v_name = '' then
    raise exception 'NAME_REQUIRED' using errcode = 'P0001';
  end if;

  if v_phone = '' then
    raise exception 'PHONE_REQUIRED' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.products
    where id = p_product_id
  ) then
    raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0001';
  end if;

  select id
    into v_existing_id
    from public.restock_notifications
   where product_id = p_product_id
     and user_id is null
     and phone = v_phone
   limit 1;

  if v_existing_id is not null then
    return jsonb_build_object('status', 'already_subscribed');
  end if;

  insert into public.restock_notifications (
    product_id,
    user_id,
    customer_name,
    phone,
    email
  )
  values (
    p_product_id,
    null,
    v_name,
    v_phone,
    v_email
  );

  return jsonb_build_object('status', 'created');
end;
$$;

comment on function public.subscribe_restock_notification_member is
  '회원 재입고 알림 신청. 프로필 정보를 자동 저장.';

comment on function public.subscribe_restock_notification_guest is
  '비회원 재입고 알림 신청. product_id + phone 중복 방지.';

grant execute on function public.subscribe_restock_notification_member(uuid) to authenticated;
grant execute on function public.subscribe_restock_notification_guest(uuid, text, text, text) to anon, authenticated;
