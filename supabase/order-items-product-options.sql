-- =============================================================================
-- !!! CAUTION — DO NOT RE-RUN AFTER p0-security-lockdown.sql !!!
-- This historical patch once trusted p_order.subtotal from the client.
-- Current secure checkout is defined in supabase/p0-security-lockdown.sql
-- (and previously coupon-shipping-policy-v1.sql). Re-running THIS file can
-- restore client-trusted prices.
-- =============================================================================
-- Product option columns on order_items + checkout RPC support
-- Run in Supabase SQL editor after existing checkout migrations.


alter table public.order_items
  add column if not exists selected_color text,
  add column if not exists selected_size text,
  add column if not exists option_id text;

comment on column public.order_items.selected_color is '주문 시점 선택 색상 스냅샷';
comment on column public.order_items.selected_size is '주문 시점 선택 사이즈 스냅샷';
comment on column public.order_items.option_id is '주문 시점 옵션 ID 스냅샷 (product_info.variants)';

-- Patch create_shop_order_with_stock to persist option fields.
-- Stock deduction still uses product.stock when no option is provided.
-- When option fields are provided, variant stock inside product_info is checked and decremented.

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
  v_option_id text;
  v_selected_color text;
  v_selected_size text;
  v_product_info jsonb;
  v_variants jsonb;
  v_variant jsonb;
  v_variant_stock integer;
  v_updated_variants jsonb := '[]'::jsonb;
  v_idx integer;
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
    v_option_id := nullif(item ->> 'option_id', '');
    v_selected_color := nullif(item ->> 'selected_color', '');
    v_selected_size := nullif(item ->> 'selected_size', '');

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    if v_option_id is not null or (v_selected_color is not null and v_selected_size is not null) then
      select product_info into v_product_info
        from public.products
       where id = v_product_id and status = 'active'
       for update;

      if not found then
        raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
      end if;

      v_variants := coalesce(v_product_info -> 'variants', '[]'::jsonb);
      v_variant := null;

      for v_idx in 0 .. jsonb_array_length(v_variants) - 1 loop
        v_variant := v_variants -> v_idx;
        if (
          (v_option_id is not null and v_variant ->> 'id' = v_option_id)
          or (
            v_option_id is null
            and coalesce(v_variant ->> 'color', '') = coalesce(v_selected_color, '')
            and coalesce(v_variant ->> 'size', '') = coalesce(v_selected_size, '')
          )
        ) then
          v_variant_stock := coalesce((v_variant ->> 'stock')::integer, 0);
          if v_variant_stock < v_quantity then
            raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
          end if;
          exit;
        end if;
        v_variant := null;
      end loop;

      if v_variant is null then
        raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
      end if;
    else
      select stock into v_stock
        from public.products
       where id = v_product_id and status = 'active'
       for update;

      if not found or v_stock < v_quantity then
        raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
      end if;
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

  insert into public.order_items (
    order_id, product_id, product_slug, product_name,
    quantity, unit_price, total_price,
    selected_color, selected_size, option_id
  )
  select
    p_order_id,
    (value ->> 'product_id')::uuid,
    nullif(value ->> 'product_slug', ''),
    value ->> 'product_name',
    (value ->> 'quantity')::integer,
    (value ->> 'unit_price')::integer,
    (value ->> 'total_price')::integer,
    nullif(value ->> 'selected_color', ''),
    nullif(value ->> 'selected_size', ''),
    nullif(value ->> 'option_id', '')
  from jsonb_array_elements(p_items) as t(value);

  for item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_product_id := (item ->> 'product_id')::uuid;
    v_quantity := (item ->> 'quantity')::integer;
    v_option_id := nullif(item ->> 'option_id', '');
    v_selected_color := nullif(item ->> 'selected_color', '');
    v_selected_size := nullif(item ->> 'selected_size', '');

    if v_option_id is not null or (v_selected_color is not null and v_selected_size is not null) then
      select product_info into v_product_info
        from public.products
       where id = v_product_id
       for update;

      v_variants := coalesce(v_product_info -> 'variants', '[]'::jsonb);
      v_updated_variants := '[]'::jsonb;

      for v_idx in 0 .. jsonb_array_length(v_variants) - 1 loop
        v_variant := v_variants -> v_idx;
        if (
          (v_option_id is not null and v_variant ->> 'id' = v_option_id)
          or (
            v_option_id is null
            and coalesce(v_variant ->> 'color', '') = coalesce(v_selected_color, '')
            and coalesce(v_variant ->> 'size', '') = coalesce(v_selected_size, '')
          )
        ) then
          v_variant_stock := greatest(coalesce((v_variant ->> 'stock')::integer, 0) - v_quantity, 0);
          v_variant := jsonb_set(v_variant, '{stock}', to_jsonb(v_variant_stock), true);
        end if;
        v_updated_variants := v_updated_variants || jsonb_build_array(v_variant);
      end loop;

      update public.products
         set product_info = jsonb_set(coalesce(product_info, '{}'::jsonb), '{variants}', v_updated_variants, true),
             updated_at = now()
       where id = v_product_id;
    else
      update public.products
         set stock = stock - v_quantity, updated_at = now()
       where id = v_product_id and stock >= v_quantity;

      get diagnostics v_rows = row_count;
      if v_rows = 0 then
        raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
      end if;
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
