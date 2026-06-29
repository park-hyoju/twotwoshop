-- =============================================================================
-- TWOTWOSHOP: Order status / payment_status / shipping_fee fix
-- =============================================================================
-- Run in Supabase SQL Editor when:
--   ERROR: orders_status_check rejects pending_payment
--   or shipping_fee is stored as 3000 instead of 4000
--
-- Safe to re-run (idempotent).
-- Run after schema.sql. Run order-checkout-v2.sql columns/RPC if not applied yet.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Ensure v2 columns exist (no-op if already applied)
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists coupon_discount_amount integer not null default 0,
  add column if not exists payment_status text not null default 'waiting_deposit';

-- -----------------------------------------------------------------------------
-- 2) Drop CHECK constraints BEFORE data migration
-- -----------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders drop constraint if exists orders_total_amount_check;
alter table public.orders drop constraint if exists orders_coupon_discount_amount_check;

-- -----------------------------------------------------------------------------
-- 3) Migrate legacy order status values
-- -----------------------------------------------------------------------------
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
where status in (
  'pending',
  'paid',
  'deposit_confirmed',
  'confirmed',
  'shipped',
  'completed'
);

-- -----------------------------------------------------------------------------
-- 4) Migrate legacy payment_status values
-- -----------------------------------------------------------------------------
update public.orders
set payment_status = case payment_status
  when 'deposit_confirmed' then 'paid'
  when 'cancelled' then 'refunded'
  else payment_status
end
where payment_status in ('deposit_confirmed', 'cancelled');

-- Sync payment_status from order status when still waiting
update public.orders
set payment_status = 'paid'
where status in ('payment_confirmed', 'preparing', 'shipping', 'delivered')
  and payment_status = 'waiting_deposit';

update public.orders
set payment_status = 'refunded'
where status in ('cancelled', 'cancel_requested')
  and payment_status not in ('refunded');

-- -----------------------------------------------------------------------------
-- 5) Enforce shipping_fee = 4000 and recalculate totals
-- -----------------------------------------------------------------------------
update public.orders
set shipping_fee = 4000,
    total_amount = subtotal - coalesce(coupon_discount_amount, 0) + 4000
where shipping_fee is distinct from 4000;

-- -----------------------------------------------------------------------------
-- 6) Add unified CHECK constraints
-- -----------------------------------------------------------------------------
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
  check (payment_status in (
    'waiting_deposit',
    'paid',
    'refunded'
  ));

alter table public.orders
  add constraint orders_coupon_discount_amount_check
  check (coupon_discount_amount >= 0 and coupon_discount_amount <= subtotal);

alter table public.orders
  add constraint orders_total_amount_check
  check (total_amount = subtotal - coupon_discount_amount + shipping_fee);

-- -----------------------------------------------------------------------------
-- 7) RPC: always use shipping_fee = 4000 (ignore client payload)
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
