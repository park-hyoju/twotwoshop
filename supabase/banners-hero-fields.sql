-- =============================================================================
-- TWOTWOSHOP: Hero banner content fields (eyebrow + headline)
-- =============================================================================
-- Run after banners.sql / banners-production.sql
-- description, button_text, button_link already exist on public.banners
-- =============================================================================

alter table public.banners
  add column if not exists eyebrow text,
  add column if not exists headline text;

comment on column public.banners.eyebrow is 'Hero 상단 작은 제목 (예: 2026 SUMMER COLLECTION)';
comment on column public.banners.headline is 'Hero 메인 제목 (예: 감각적인 데일리 룩, TWOTWOSHOP)';

-- Backfill headline from legacy title for existing rows
update public.banners
set headline = title
where headline is null or trim(headline) = '';

update public.banners
set eyebrow = 'TWOTWOSHOP'
where eyebrow is null or trim(eyebrow) = '';
