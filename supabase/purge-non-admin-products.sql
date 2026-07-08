-- =============================================================================
-- TWOTWOSHOP: Purge non-admin products (seed / demo catalog)
-- =============================================================================
-- Keeps products registered through the admin panel.
-- Run in Supabase SQL Editor after deploying app changes.
-- =============================================================================

alter table public.products
  add column if not exists is_admin_registered boolean not null default false;

comment on column public.products.is_admin_registered is
  'true when created or saved via admin product editor';

-- Existing operator products: anything outside the dev seed slug catalog.
update public.products
set is_admin_registered = true
where slug not in (
  'classic-linen-shirt',
  'wide-slacks-pants',
  'flower-midi-dress',
  'canvas-low-sneakers-w',
  'daily-crossbag',
  'summer-blouse',
  'premium-leather-belt-w',
  'ribbon-scarf',
  'mini-tote-bag',
  'soft-knit-cardigan',
  'women-baseball-cap',
  'cooling-golf-tee',
  'stretch-chino-pants',
  'overfit-denim-jacket',
  'lightweight-runner-shoes',
  'basic-leather-belt',
  'airy-cargo-shorts',
  'linen-shirts-m',
  'canvas-low-sneakers-m',
  'leather-wallet',
  'men-baseball-cap',
  'classic-loafers'
);

-- Remove seed/demo catalog and any other non-admin rows.
delete from public.products
where is_admin_registered = false;

-- Clean orphaned related-product links (if any remain).
delete from public.product_related pr
where not exists (select 1 from public.products p where p.id = pr.product_id)
   or not exists (select 1 from public.products p where p.id = pr.related_product_id);
