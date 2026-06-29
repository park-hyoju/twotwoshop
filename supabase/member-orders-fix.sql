-- =============================================================================
-- TWOTWOSHOP: Member orders fix (user_id link + RLS + RPC)
-- =============================================================================
-- Run in Supabase SQL Editor when MyPage 주문내역 fails to load.
-- Safe to re-run (idempotent).
-- =============================================================================

-- 1) Link orders to authenticated members
alter table public.orders
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_orders_user_id_created_at
  on public.orders (user_id, created_at desc);

-- Backfill by profile phone when possible
update public.orders o
set user_id = p.id
from public.user_profiles p
where o.user_id is null
  and p.phone is not null
  and trim(p.phone) <> ''
  and public.normalize_inquiry_phone(p.phone) = public.normalize_inquiry_phone(o.customer_phone);

-- 2) Guest order RPC: persist auth.uid() for logged-in checkout
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

grant execute on function public.create_guest_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb) to anon;
grant execute on function public.create_guest_order_with_stock(uuid, jsonb, uuid, jsonb, jsonb) to authenticated;

-- 3) RPC: member order list (security definer — bypasses RLS)
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

-- 4) RLS: members can read only their own orders (direct select fallback)
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

-- 5) Prevent linking orders to another member on insert
drop policy if exists "orders_insert_anon" on public.orders;

create policy "orders_insert_anon"
  on public.orders
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
