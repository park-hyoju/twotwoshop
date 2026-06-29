-- =============================================================================
-- TWOTWOSHOP: Product related recommendations (product_related)
-- =============================================================================
-- Run after schema.sql and admin-products-rls.sql
-- =============================================================================

create table if not exists public.product_related (
  product_id uuid not null references public.products (id) on delete cascade,
  related_product_id uuid not null references public.products (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, related_product_id),
  constraint product_related_not_self check (product_id <> related_product_id)
);

create index if not exists product_related_product_id_idx
  on public.product_related (product_id);

create index if not exists product_related_sort_order_idx
  on public.product_related (product_id, sort_order);

comment on table public.product_related is
  'Admin-curated related products shown on product detail pages.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.product_related enable row level security;

grant select, insert, update, delete on table public.product_related to anon, authenticated;

drop policy if exists "product_related_select" on public.product_related;

create policy "product_related_select"
  on public.product_related
  for select
  to anon, authenticated
  using (true);

drop policy if exists "product_related_insert" on public.product_related;

create policy "product_related_insert"
  on public.product_related
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "product_related_update" on public.product_related;

create policy "product_related_update"
  on public.product_related
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "product_related_delete" on public.product_related;

create policy "product_related_delete"
  on public.product_related
  for delete
  to anon, authenticated
  using (true);
