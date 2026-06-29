-- =============================================================================
-- TWOTWOSHOP: Order fulfillment (payment confirm, shipping, tracking)
-- =============================================================================
-- Run in Supabase SQL Editor after order-checkout-v2.sql
-- Safe to re-run (idempotent).
-- =============================================================================

alter table public.orders
  add column if not exists courier text,
  add column if not exists tracking_number text,
  add column if not exists paid_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz;

comment on column public.orders.courier is '택배사명 (배송중 처리 시 저장)';
comment on column public.orders.tracking_number is '운송장번호';
comment on column public.orders.paid_at is '입금 확인 시각';
comment on column public.orders.shipped_at is '배송 시작 시각';
comment on column public.orders.delivered_at is '배송 완료 시각';

-- -----------------------------------------------------------------------------
-- Update member order detail RPC (include fulfillment fields)
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
    'courier', o.courier,
    'tracking_number', o.tracking_number,
    'paid_at', o.paid_at,
    'shipped_at', o.shipped_at,
    'delivered_at', o.delivered_at,
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
