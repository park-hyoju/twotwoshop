-- =============================================================================
-- TWOTWOSHOP: Product detail media + video storage support
-- =============================================================================
-- Run in Supabase SQL Editor.
-- =============================================================================

alter table public.products
  add column if not exists detail_media jsonb not null default '[]'::jsonb;

comment on column public.products.detail_media is
  'Ordered detail page media: [{type, url, order, filename, thumbnail, duration, width, height}]';

-- Migrate legacy detail images from short_description intro payload.
update public.products p
set detail_media = sub.media
from (
  select
    id,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'type', 'image',
            'url', url,
            'order', ord - 1,
            'filename', split_part(url, '/', array_length(string_to_array(url, '/'), 1)),
            'thumbnail', null,
            'duration', null,
            'width', null,
            'height', null
          )
          order by ord
        )
        from (
          select value as url, ordinality as ord
          from jsonb_array_elements_text(
            case
              when short_description like '__TWOTWOSHOP_INTRO_v2__:%' then
                (substring(short_description from length('__TWOTWOSHOP_INTRO_v2__:') + 1))::jsonb -> 'detailImages'
              else '[]'::jsonb
            end
          ) with ordinality
        ) legacy_urls
      ),
      '[]'::jsonb
    ) as media
  from public.products
) sub
where p.id = sub.id
  and (p.detail_media is null or p.detail_media = '[]'::jsonb)
  and sub.media != '[]'::jsonb;

-- Allow video uploads up to 500MB in product-images bucket.
update storage.buckets
set
  file_size_limit = 524288000,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
where id = 'product-images';
