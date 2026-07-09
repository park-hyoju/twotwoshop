-- =============================================================================
-- Optional admin product columns (detail_media, is_admin_registered)
-- =============================================================================
-- Run in Supabase SQL Editor when you want structured detail_media JSON storage.
-- Product create/save works WITHOUT this migration (uses short_description payload).
-- =============================================================================

alter table public.products
  add column if not exists detail_media jsonb not null default '[]'::jsonb;

alter table public.products
  add column if not exists is_admin_registered boolean not null default false;

comment on column public.products.detail_media is
  'Ordered detail page media: [{type, url, order, filename, thumbnail, duration, width, height}]';

comment on column public.products.is_admin_registered is
  'true when created or saved via admin product editor';
