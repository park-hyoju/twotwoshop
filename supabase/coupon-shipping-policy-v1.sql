-- =============================================================================
-- TWOTWOSHOP: 신규회원 쿠폰 + 무료배송 정책 (v1)
-- =============================================================================
-- Run in Supabase SQL Editor after order-checkout-v2.sql + security-hardening-v3.sql
--
-- Coupon: 신규회원 5,000원 할인, 70,000원 이상 주문 시 사용
-- Shipping: subtotal >= 70,000 → 무료, 미만 → 4,000원 (쿠폰 할인 전 subtotal 기준)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Coupon master data
-- -----------------------------------------------------------------------------
update public.coupons
   set is_active = false
 where code in ('WELCOME3000', 'SAVE5000');

insert into public.coupons (code, title, discount_amount, min_order_amount, is_active)
values ('WELCOME5000', '신규회원 5,000원 할인', 5000, 70000, true)
on conflict (code) do update
  set title = excluded.title,
      discount_amount = excluded.discount_amount,
      min_order_amount = excluded.min_order_amount,
      is_active = true;

-- -----------------------------------------------------------------------------
-- 2) Welcome coupon issuance (1 per member)
-- -----------------------------------------------------------------------------
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
   where code = 'WELCOME5000'
     and is_active = true
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
-- 3) Member coupons: only RPC may mark used (block client UPDATE)
-- -----------------------------------------------------------------------------
revoke update on table public.member_coupons from authenticated;

drop policy if exists "member_coupons_update_own" on public.member_coupons;

-- -----------------------------------------------------------------------------
-- 4) get_member_coupons — unused coupons only (unchanged filter, kept for clarity)
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

-- -----------------------------------------------------------------------------
-- 5) create_shop_order_with_stock — server-side prices + coupon/shipping validation
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
as $body$
declare
  item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_stock integer;
  v_rows integer;
  v_user_id uuid;
  v_subtotal integer := 0;
  v_unit_price integer;
  v_line_total integer;
  v_product_name text;
  v_product_slug text;
  v_shipping_base constant integer := 4000;
  v_free_shipping_min constant integer := 70000;
  v_shipping_fee integer;
  v_coupon_discount integer := 0;
  v_total integer;
  v_coupon record;
begin
  v_user_id := auth.uid();

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = 'P0001';
  end if;

  create temp table _shop_order_lines (
    product_id uuid not null,
    product_slug text,
    product_name text not null,
    quantity integer not null check (quantity > 0),
    unit_price integer not null check (unit_price >= 0),
    total_price integer not null check (total_price >= 0),
    check (total_price = unit_price * quantity)
  ) on commit drop;

  for item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_product_id := (item ->> 'product_id')::uuid;
    v_quantity := (item ->> 'quantity')::integer;

    if v_product_id is null then
      raise exception 'INVALID_PRODUCT' using errcode = 'P0001';
    end if;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    select p.price, p.name, p.slug, p.stock
      into v_unit_price, v_product_name, v_product_slug, v_stock
      from public.products p
     where p.id = v_product_id
       and p.status = 'active'
     for update;

    if not found then
      raise exception 'PRODUCT_NOT_AVAILABLE' using errcode = 'P0001';
    end if;

    if v_stock < v_quantity then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
    end if;

    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into _shop_order_lines (
      product_id, product_slug, product_name, quantity, unit_price, total_price
    )
    values (
      v_product_id, v_product_slug, v_product_name, v_quantity, v_unit_price, v_line_total
    );
  end loop;

  if v_subtotal <= 0 then
    raise exception 'INVALID_SUBTOTAL' using errcode = 'P0001';
  end if;

  -- Free shipping based on pre-coupon subtotal
  v_shipping_fee := case
    when v_subtotal >= v_free_shipping_min then 0
    else v_shipping_base
  end;

  if p_member_coupon_id is not null then
    if v_user_id is null then
      raise exception 'COUPON_REQUIRES_LOGIN' using errcode = 'P0001';
    end if;

    if to_regclass('public.member_coupons') is null or to_regclass('public.coupons') is null then
      raise exception 'COUPON_TABLES_MISSING' using errcode = 'P0001';
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

  insert into public.order_items (
    order_id, product_id, product_slug, product_name, quantity, unit_price, total_price
  )
  select
    p_order_id, product_id, product_slug, product_name, quantity, unit_price, total_price
  from _shop_order_lines;

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
     where id = p_member_coupon_id
       and user_id = v_user_id
       and is_used = false;

    if not found then
      raise exception 'COUPON_ALREADY_USED' using errcode = 'P0001';
    end if;
  end if;
end;
$body$;

comment on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) is
  'Checkout RPC. Prices/subtotal from products.price. Shipping free when subtotal >= 70000. Coupon validated server-side.';

revoke all on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) from public;
grant execute on function public.create_shop_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb, uuid) to anon, authenticated;
