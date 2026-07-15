-- =============================================================================
-- ONE-OFF: Delete two specific test orders (2026-07-15)
-- =============================================================================
-- Run ONCE in Supabase SQL Editor after verifying order numbers.
--
-- Targets ONLY:
--   TT-20260715-492030
--   TT-20260714-055098
--
-- Does NOT:
--   - DELETE without WHERE
--   - Touch products, members, inquiries, notices
--   - Open RLS or grant broad DELETE
--
-- Safe to re-run: already-deleted rows affect 0 counts.
-- =============================================================================

begin;

-- Snapshot target rows before delete (for orphan customer cleanup + final report)
create temp table _one_off_target_orders on commit drop as
select id, order_number, customer_id
from public.orders
where order_number in (
  'TT-20260715-492030',
  'TT-20260714-055098'
);

-- 1) order_items for target orders
with target_orders as (
  select id
  from _one_off_target_orders
)
delete from public.order_items
where order_id in (select id from target_orders);

-- 2) target orders
with target_orders as (
  select id
  from _one_off_target_orders
)
delete from public.orders
where id in (select id from target_orders);

-- 3) orphan customers (only if no other order references them)
delete from public.customers c
where c.id in (
  select distinct customer_id
  from _one_off_target_orders
  where customer_id is not null
)
and not exists (
  select 1
  from public.orders o
  where o.customer_id = c.id
);

-- 4) Deleted order count + numbers (expect deleted_orders = 2 if both existed)
select
  count(*) as deleted_orders,
  coalesce(array_agg(order_number order by order_number), '{}'::text[]) as deleted_order_numbers
from _one_off_target_orders;

commit;

-- Remaining rows for these order numbers (expect no rows)
select order_number, count(*) as remaining
from public.orders
where order_number in (
  'TT-20260715-492030',
  'TT-20260714-055098'
)
group by order_number;
