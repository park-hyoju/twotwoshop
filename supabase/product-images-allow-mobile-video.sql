-- =============================================================================
-- TWOTWOSHOP: product-images bucket — allow mobile video MIME types
-- =============================================================================
-- Run in Supabase SQL Editor (production).
-- Fixes: mime type video/quicktime is not supported (invalid_mime_type)
-- Keeps existing image + mp4/webm support; adds iPhone MOV (quicktime) and
-- other common mobile camera formats.
-- Does NOT change RLS, paths, or file size policy beyond ensuring 500MB for video.
-- =============================================================================

update storage.buckets
set
  file_size_limit = greatest(coalesce(file_size_limit, 0), 524288000),
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v',
    'video/m4v',
    'video/x-matroska',
    'video/avi',
    'video/x-msvideo',
    'video/3gpp',
    'video/3gpp2'
  ]
where id = 'product-images';

-- Verify
select id, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'product-images';
