-- =============================================================================
-- Product category unification + atomic stock decrement on order
-- =============================================================================
-- Run after schema.sql and admin-products-rls.sql
-- =============================================================================

alter table public.products
  add column if not exists product_category text;

comment on column public.products.product_category is
  '통합 상품 카테고리 ID (productCategories.ts와 동일). 예: women_top, perfume';

create index if not exists idx_products_product_category
  on public.products (product_category);

-- Backfill from legacy gender / display_category / detail_category
update public.products
set product_category = case
  when gender = 'perfume' then 'perfume'
  when gender = 'women' and display_category = 'top' then 'women_top'
  when gender = 'women' and display_category = 'bottom' and detail_category = 'skirt' then 'women_skirt'
  when gender = 'women' and display_category = 'bottom' then 'women_bottom'
  when gender = 'women' and display_category = 'dress' then 'women_dress'
  when gender = 'women' and display_category = 'shoes' then 'shoes'
  when gender = 'men' and display_category = 'top' then 'men_top'
  when gender = 'men' and display_category = 'bottom' then 'men_bottom'
  when gender = 'men' and display_category = 'shoes' then 'shoes'
  when detail_category = 'bag' then 'bag'
  when detail_category = 'belt' then 'belt'
  when detail_category in ('sneakers', 'loafers') or display_category = 'shoes' then 'shoes'
  when detail_category = 'accessory' then 'accessory'
  when detail_category = 'etc' then 'etc'
  else coalesce(product_category, 'etc')
end
where product_category is null;

-- -----------------------------------------------------------------------------
-- Guest order + stock decrement (atomic)
-- -----------------------------------------------------------------------------
create or replace function public.create_guest_order_with_stock(
  p_customer_id uuid,
  p_customer jsonb,
  p_order_id uuid,
  p_order jsonb,
  p_items jsonb
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
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = 'P0001';
  end if;

  -- Validate stock with row locks
  for item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_product_id := (item ->> 'product_id')::uuid;
    v_quantity := (item ->> 'quantity')::integer;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    select stock
      into v_stock
      from public.products
     where id = v_product_id
       and status = 'active'
     for update;

    if not found then
      raise exception 'PRODUCT_NOT_AVAILABLE' using errcode = 'P0001';
    end if;

    if v_stock < v_quantity then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
    end if;
  end loop;

  insert into public.customers (
    id,
    name,
    phone,
    zipcode,
    address1,
    address2
  )
  values (
    p_customer_id,
    p_customer ->> 'name',
    p_customer ->> 'phone',
    nullif(p_customer ->> 'zipcode', ''),
    nullif(p_customer ->> 'address1', ''),
    nullif(p_customer ->> 'address2', '')
  );

  insert into public.orders (
    id,
    order_number,
    customer_id,
    user_id,
    customer_name,
    customer_phone,
    zipcode,
    address1,
    address2,
    memo,
    subtotal,
    shipping_fee,
    total_amount,
    status
  )
  values (
    p_order_id,
    p_order ->> 'order_number',
    p_customer_id,
    auth.uid(),
    p_order ->> 'customer_name',
    p_order ->> 'customer_phone',
    nullif(p_order ->> 'zipcode', ''),
    nullif(p_order ->> 'address1', ''),
    nullif(p_order ->> 'address2', ''),
    nullif(p_order ->> 'memo', ''),
    (p_order ->> 'subtotal')::integer,
    (p_order ->> 'shipping_fee')::integer,
    (p_order ->> 'total_amount')::integer,
    'pending'
  );

  insert into public.order_items (
    order_id,
    product_id,
    product_slug,
    product_name,
    quantity,
    unit_price,
    total_price
  )
  select
    p_order_id,
    (value ->> 'product_id')::uuid,
    nullif(value ->> 'product_slug', ''),
    value ->> 'product_name',
    (value ->> 'quantity')::integer,
    (value ->> 'unit_price')::integer,
    (value ->> 'total_price')::integer
  from jsonb_array_elements(p_items) as t(value);

  -- Decrement stock (never below zero)
  for item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_product_id := (item ->> 'product_id')::uuid;
    v_quantity := (item ->> 'quantity')::integer;

    update public.products
       set stock = stock - v_quantity,
           updated_at = now()
     where id = v_product_id
       and stock >= v_quantity;

    get diagnostics v_rows = row_count;

    if v_rows = 0 then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
    end if;
  end loop;
end;
$$;

comment on function public.create_guest_order_with_stock is
  '비회원 주문 생성 + 재고 원자적 차감. 재고 부족 시 INSUFFICIENT_STOCK 예외.';

grant execute on function public.create_guest_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb) to anon;
grant execute on function public.create_guest_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb) to authenticated;
