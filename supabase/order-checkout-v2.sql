-- =============================================================================
-- TWOTWOSHOP: Order / Checkout v2 (depositor, coupon, payment_status, recipient)
-- =============================================================================
-- Run in Supabase SQL Editor after schema.sql + member-orders-fix.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Extend orders table
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists customer_email text,
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text,
  add column if not exists depositor_name text,
  add column if not exists payment_method text not null default 'bank_transfer',
  add column if not exists coupon_discount_amount integer not null default 0,
  add column if not exists payment_status text not null default 'waiting_deposit',
  add column if not exists member_coupon_id uuid;

-- Backfill recipient/depositor from legacy columns
update public.orders
set recipient_name = coalesce(nullif(trim(recipient_name), ''), customer_name),
    recipient_phone = coalesce(nullif(trim(recipient_phone), ''), customer_phone),
    depositor_name = coalesce(nullif(trim(depositor_name), ''), customer_name)
where recipient_name is null
   or recipient_phone is null
   or depositor_name is null;

-- Drop constraints BEFORE migrating status/payment data
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders drop constraint if exists orders_total_amount_check;
alter table public.orders drop constraint if exists orders_coupon_discount_amount_check;

-- Migrate legacy status values (constraints dropped above)
update public.orders
set status = case status
  when 'pending' then 'pending_payment'
  when 'paid' then 'payment_confirmed'
  when 'deposit_confirmed' then 'payment_confirmed'
  when 'confirmed' then 'preparing'
  when 'shipped' then 'shipping'
  when 'completed' then 'delivered'
  else status
end
where status in ('pending', 'paid', 'deposit_confirmed', 'confirmed', 'shipped', 'completed');

update public.orders
set payment_status = case payment_status
  when 'deposit_confirmed' then 'paid'
  when 'cancelled' then 'refunded'
  else payment_status
end
where payment_status in ('deposit_confirmed', 'cancelled');

update public.orders
set shipping_fee = 4000,
    total_amount = subtotal - coalesce(coupon_discount_amount, 0) + 4000
where shipping_fee is distinct from 4000;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    'pending_payment',
    'payment_confirmed',
    'preparing',
    'shipping',
    'delivered',
    'cancel_requested',
    'cancelled'
  ));

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('waiting_deposit', 'paid', 'refunded'));

alter table public.orders drop constraint if exists orders_total_amount_check;

alter table public.orders
  add constraint orders_total_amount_check
  check (total_amount = subtotal - coupon_discount_amount + shipping_fee);

alter table public.orders drop constraint if exists orders_coupon_discount_amount_check;

alter table public.orders
  add constraint orders_coupon_discount_amount_check
  check (coupon_discount_amount >= 0 and coupon_discount_amount <= subtotal);

-- -----------------------------------------------------------------------------
-- 2) Coupons
-- -----------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  discount_amount integer not null check (discount_amount > 0),
  min_order_amount integer not null default 0 check (min_order_amount >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.member_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  is_used boolean not null default false,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, coupon_id)
);

create index if not exists idx_member_coupons_user_id
  on public.member_coupons (user_id, is_used, created_at desc);

alter table public.coupons enable row level security;
alter table public.member_coupons enable row level security;

grant select on table public.coupons to authenticated;
grant select, update on table public.member_coupons to authenticated;

drop policy if exists "coupons_select_active" on public.coupons;
create policy "coupons_select_active"
  on public.coupons for select to authenticated
  using (is_active = true);

drop policy if exists "member_coupons_select_own" on public.member_coupons;
create policy "member_coupons_select_own"
  on public.member_coupons for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "member_coupons_update_own" on public.member_coupons;
create policy "member_coupons_update_own"
  on public.member_coupons for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Seed coupons (idempotent)
insert into public.coupons (code, title, discount_amount, min_order_amount, is_active)
values ('WELCOME5000', '신규회원 5,000원 할인', 5000, 70000, true)
on conflict (code) do update
  set title = excluded.title,
      discount_amount = excluded.discount_amount,
      min_order_amount = excluded.min_order_amount,
      is_active = true;

-- -----------------------------------------------------------------------------
-- 3) RPC: member coupons
-- -----------------------------------------------------------------------------
create or replace function public.get_member_coupons()
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
          'id', mc.id,
          'coupon_id', c.id,
          'code', c.code,
          'title', c.title,
          'discount_amount', c.discount_amount,
          'min_order_amount', c.min_order_amount,
          'expires_at', mc.expires_at
        )
        order by c.discount_amount desc
      )
      from public.member_coupons mc
      inner join public.coupons c on c.id = mc.coupon_id
      where mc.user_id = v_user_id
        and mc.is_used = false
        and c.is_active = true
        and (mc.expires_at is null or mc.expires_at > now())
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.get_member_coupons() from public;
grant execute on function public.get_member_coupons() to authenticated;

-- Issue welcome coupon on first fetch (optional helper)
create or replace function public.ensure_welcome_coupon()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_coupon_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return;
  end if;

  select id into v_coupon_id
    from public.coupons
   where code = 'WELCOME5000' and is_active = true
   limit 1;
  if v_coupon_id is null then
    return;
  end if;

  insert into public.member_coupons (user_id, coupon_id, expires_at)
  values (v_user_id, v_coupon_id, null)
  on conflict (user_id, coupon_id) do nothing;
end;
$$;

revoke all on function public.ensure_welcome_coupon() from public;
grant execute on function public.ensure_welcome_coupon() to authenticated;

-- -----------------------------------------------------------------------------
-- 4) RPC: create order with stock + coupon
-- -----------------------------------------------------------------------------
create or replace function public.create_shop_order_with_stock(
  p_customer_id uuid,
  p_customer jsonb,
  p_order_id uuid,
  p_order jsonb,
  p_items jsonb,
  p_member_coupon_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_stock integer;
  v_rows integer;
  v_user_id uuid;
  v_subtotal integer;
  v_shipping_fee constant integer := 4000;
  v_coupon_discount integer := 0;
  v_total integer;
  v_coupon record;
begin
  v_user_id := auth.uid();

  if jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = 'P0001';
  end if;

  v_subtotal := (p_order ->> 'subtotal')::integer;

  if p_member_coupon_id is not null then
    if v_user_id is null then
      raise exception 'COUPON_REQUIRES_LOGIN' using errcode = 'P0001';
    end if;

    select c.discount_amount, c.min_order_amount, c.title
      into v_coupon
      from public.member_coupons mc
      inner join public.coupons c on c.id = mc.coupon_id
     where mc.id = p_member_coupon_id
       and mc.user_id = v_user_id
       and mc.is_used = false
       and c.is_active = true
       and (mc.expires_at is null or mc.expires_at > now())
     for update;

    if not found then
      raise exception 'INVALID_COUPON' using errcode = 'P0001';
    end if;

    if v_subtotal < v_coupon.min_order_amount then
      raise exception 'COUPON_MIN_ORDER_NOT_MET' using errcode = 'P0001';
    end if;

    v_coupon_discount := least(v_coupon.discount_amount, v_subtotal);
  end if;

  v_total := v_subtotal - v_coupon_discount + v_shipping_fee;

  if v_total <= 0 then
    raise exception 'INVALID_TOTAL' using errcode = 'P0001';
  end if;

  for item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_product_id := (item ->> 'product_id')::uuid;
    v_quantity := (item ->> 'quantity')::integer;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    select stock into v_stock
      from public.products
     where id = v_product_id and status = 'active'
     for update;

    if not found or v_stock < v_quantity then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
    end if;
  end loop;

  insert into public.customers (id, name, phone, zipcode, address1, address2)
  values (
    p_customer_id,
    p_customer ->> 'name',
    p_customer ->> 'phone',
    nullif(p_customer ->> 'zipcode', ''),
    nullif(p_customer ->> 'address1', ''),
    nullif(p_customer ->> 'address2', '')
  );

  insert into public.orders (
    id, order_number, customer_id, user_id,
    customer_name, customer_phone, customer_email,
    recipient_name, recipient_phone,
    zipcode, address1, address2, memo,
    depositor_name, payment_method,
    subtotal, coupon_discount_amount, shipping_fee, total_amount,
    payment_status, status, member_coupon_id
  )
  values (
    p_order_id,
    p_order ->> 'order_number',
    p_customer_id,
    v_user_id,
    p_order ->> 'customer_name',
    p_order ->> 'customer_phone',
    nullif(p_order ->> 'customer_email', ''),
    p_order ->> 'recipient_name',
    p_order ->> 'recipient_phone',
    nullif(p_order ->> 'zipcode', ''),
    nullif(p_order ->> 'address1', ''),
    nullif(p_order ->> 'address2', ''),
    nullif(p_order ->> 'memo', ''),
    p_order ->> 'depositor_name',
    coalesce(nullif(p_order ->> 'payment_method', ''), 'bank_transfer'),
    v_subtotal,
    v_coupon_discount,
    v_shipping_fee,
    v_total,
    'waiting_deposit',
    'pending_payment',
    p_member_coupon_id
  );

  insert into public.order_items (order_id, product_id, product_slug, product_name, quantity, unit_price, total_price)
  select
    p_order_id,
    (value ->> 'product_id')::uuid,
    nullif(value ->> 'product_slug', ''),
    value ->> 'product_name',
    (value ->> 'quantity')::integer,
    (value ->> 'unit_price')::integer,
    (value ->> 'total_price')::integer
  from jsonb_array_elements(p_items) as t(value);

  for item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_product_id := (item ->> 'product_id')::uuid;
    v_quantity := (item ->> 'quantity')::integer;

    update public.products
       set stock = stock - v_quantity, updated_at = now()
     where id = v_product_id and stock >= v_quantity;

    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
    end if;
  end loop;

  if p_member_coupon_id is not null then
    update public.member_coupons
       set is_used = true, used_at = now()
     where id = p_member_coupon_id and user_id = v_user_id;
  end if;
end;
$$;

grant execute on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) to anon;
grant execute on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 5) Update get_member_orders RPC
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
  if v_user_id is null then return '[]'::jsonb; end if;

  select nullif(trim(phone), '') into v_phone
    from public.user_profiles where id = v_user_id;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'order_number', o.order_number,
          'status', o.status,
          'payment_status', o.payment_status,
          'subtotal', o.subtotal,
          'coupon_discount_amount', o.coupon_discount_amount,
          'shipping_fee', o.shipping_fee,
          'total_amount', o.total_amount,
          'customer_name', o.customer_name,
          'depositor_name', o.depositor_name,
          'created_at', o.created_at,
          'item_count', (select count(*)::int from public.order_items oi where oi.order_id = o.id),
          'first_product_name', (
            select oi.product_name from public.order_items oi
            where oi.order_id = o.id order by oi.created_at asc limit 1
          )
        ) order by o.created_at desc
      )
      from public.orders o
      where o.user_id = v_user_id
         or (v_phone is not null and public.normalize_inquiry_phone(o.customer_phone) = public.normalize_inquiry_phone(v_phone))
    ),
    '[]'::jsonb
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6) RPC: get member order detail
-- -----------------------------------------------------------------------------
create or replace function public.get_member_order_by_id(p_order_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_user_id uuid;
  v_phone text;
  v_order jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then return null; end if;

  select nullif(trim(phone), '') into v_phone
    from public.user_profiles where id = v_user_id;

  select jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'status', o.status,
    'payment_status', o.payment_status,
    'subtotal', o.subtotal,
    'coupon_discount_amount', o.coupon_discount_amount,
    'shipping_fee', o.shipping_fee,
    'total_amount', o.total_amount,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'customer_email', o.customer_email,
    'recipient_name', o.recipient_name,
    'recipient_phone', o.recipient_phone,
    'zipcode', o.zipcode,
    'address1', o.address1,
    'address2', o.address2,
    'memo', o.memo,
    'depositor_name', o.depositor_name,
    'payment_method', o.payment_method,
    'created_at', o.created_at,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_slug', oi.product_slug,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          ) order by oi.created_at asc
        )
        from public.order_items oi where oi.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  into v_order
  from public.orders o
  where o.id = p_order_id
    and (
      o.user_id = v_user_id
      or (v_phone is not null and public.normalize_inquiry_phone(o.customer_phone) = public.normalize_inquiry_phone(v_phone))
    );

  return v_order;
end;
$$;

revoke all on function public.get_member_order_by_id(uuid) from public;
grant execute on function public.get_member_order_by_id(uuid) to authenticated;
