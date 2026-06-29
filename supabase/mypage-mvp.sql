-- =============================================================================
-- TWOTWOSHOP: MyPage MVP (addresses, member orders, restock list, stats)
-- =============================================================================
-- Run in Supabase SQL Editor after schema.sql and user-profiles-rls.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Member order link (optional backfill by profile phone)
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_orders_user_id_created_at
  on public.orders (user_id, created_at desc);

-- Backfill: link orders where profile phone matches order phone
update public.orders o
set user_id = p.id
from public.user_profiles p
where o.user_id is null
  and p.phone is not null
  and trim(p.phone) <> ''
  and public.normalize_inquiry_phone(p.phone) = public.normalize_inquiry_phone(o.customer_phone);

-- -----------------------------------------------------------------------------
-- 2) Saved addresses — see also supabase/customer-addresses.sql (standalone)
-- -----------------------------------------------------------------------------
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

create index if not exists idx_customer_addresses_user_id
  on public.customer_addresses (user_id, created_at desc);

drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;

create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
  for each row
  execute function public.set_updated_at();

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

-- -----------------------------------------------------------------------------
-- 3) RPC: member orders
-- -----------------------------------------------------------------------------
create or replace function public.get_member_orders()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_user_id uuid;
  v_phone text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return '[]'::jsonb;
  end if;

  select nullif(trim(phone), '')
    into v_phone
    from public.user_profiles
   where id = v_user_id;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'order_number', o.order_number,
          'status', o.status,
          'subtotal', o.subtotal,
          'shipping_fee', o.shipping_fee,
          'total_amount', o.total_amount,
          'customer_name', o.customer_name,
          'created_at', o.created_at,
          'item_count', (
            select count(*)::int
            from public.order_items oi
            where oi.order_id = o.id
          ),
          'first_product_name', (
            select oi.product_name
            from public.order_items oi
            where oi.order_id = o.id
            order by oi.created_at asc
            limit 1
          )
        )
        order by o.created_at desc
      )
      from public.orders o
      where o.user_id = v_user_id
         or (
           v_phone is not null
           and public.normalize_inquiry_phone(o.customer_phone) = public.normalize_inquiry_phone(v_phone)
         )
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.get_member_orders() from public;
grant execute on function public.get_member_orders() to authenticated;

-- -----------------------------------------------------------------------------
-- 3-1) Member SELECT RLS (direct query fallback when RPC unavailable)
-- -----------------------------------------------------------------------------
grant select on table public.orders to authenticated;
grant select on table public.order_items to authenticated;

drop policy if exists "orders_select_own" on public.orders;

create policy "orders_select_own"
  on public.orders
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "order_items_select_own" on public.order_items;

create policy "order_items_select_own"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 4) RPC: member restock notifications
-- -----------------------------------------------------------------------------
create or replace function public.get_member_restock_notifications()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', rn.id,
          'product_id', rn.product_id,
          'product_name', p.name,
          'product_slug', p.slug,
          'is_notified', rn.is_notified,
          'created_at', rn.created_at,
          'notified_at', rn.notified_at
        )
        order by rn.created_at desc
      )
      from public.restock_notifications rn
      inner join public.products p on p.id = rn.product_id
      where rn.user_id = v_user_id
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.get_member_restock_notifications() from public;
grant execute on function public.get_member_restock_notifications() to authenticated;

-- -----------------------------------------------------------------------------
-- 5) RPC: member inquiries (profile name + phone or email)
-- -----------------------------------------------------------------------------
create or replace function public.get_member_inquiries()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_user_id uuid;
  v_name text;
  v_phone text;
  v_email text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return '[]'::jsonb;
  end if;

  select nullif(trim(name), ''), nullif(trim(phone), ''), nullif(trim(email), '')
    into v_name, v_phone, v_email
    from public.user_profiles
   where id = v_user_id;

  if v_email is null then
    select nullif(trim(u.email), '')
      into v_email
      from auth.users u
     where u.id = v_user_id;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'inquiry_code', i.inquiry_code,
          'type', i.type,
          'status', i.status,
          'message', i.message,
          'admin_reply', i.admin_reply,
          'created_at', i.created_at,
          'updated_at', i.updated_at,
          'customer_read_at', i.customer_read_at,
          'has_unread_reply', (
            i.admin_reply is not null
            and (
              i.customer_read_at is null
              or i.updated_at > i.customer_read_at
            )
          )
        )
        order by i.updated_at desc
      )
      from public.customer_inquiries i
      where (
        v_phone is not null
        and v_name is not null
        and trim(i.name) = v_name
        and public.normalize_inquiry_phone(i.phone) = public.normalize_inquiry_phone(v_phone)
      )
      or (
        v_email is not null
        and lower(trim(coalesce(i.email, ''))) = lower(v_email)
      )
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.get_member_inquiries() from public;
grant execute on function public.get_member_inquiries() to authenticated;

-- -----------------------------------------------------------------------------
-- 6) RPC: mypage stats
-- -----------------------------------------------------------------------------
create or replace function public.get_mypage_stats()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_user_id uuid;
  v_orders jsonb;
  v_inquiries jsonb;
  v_address_count int;
  v_restock jsonb;
  v_unread_inquiries int;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return jsonb_build_object(
      'order_count', 0,
      'inquiry_count', 0,
      'address_count', 0,
      'notification_count', 0
    );
  end if;

  v_orders := public.get_member_orders();
  v_inquiries := public.get_member_inquiries();
  v_restock := public.get_member_restock_notifications();

  select count(*)::int
    into v_address_count
    from public.customer_addresses
   where user_id = v_user_id;

  select count(*)::int
    into v_unread_inquiries
    from jsonb_array_elements(v_inquiries) elem
   where (elem->>'has_unread_reply')::boolean = true;

  return jsonb_build_object(
    'order_count', coalesce(jsonb_array_length(v_orders), 0),
    'inquiry_count', coalesce(jsonb_array_length(v_inquiries), 0),
    'address_count', coalesce(v_address_count, 0),
    'notification_count', coalesce(v_unread_inquiries, 0)
      + (
        select count(*)::int
        from jsonb_array_elements(v_restock) elem
        where (elem->>'is_notified')::boolean = true
      )
  );
end;
$$;

revoke all on function public.get_mypage_stats() from public;
grant execute on function public.get_mypage_stats() to authenticated;
