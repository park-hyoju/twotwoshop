-- =============================================================================
-- TWOTWOSHOP: product-images bucket — allow mobile video MIME types
-- =============================================================================
-- 필수: 이 SQL을 Supabase SQL Editor에서 실행해야 합니다.
-- 프론트엔드만 수정해도 Storage가 video/quicktime 등을 거절하면
-- "mime type video/quicktime is not supported (invalid_mime_type)" 가 납니다.
--
-- 기존 이미지 MIME + MP4/WEBM/MOV(quicktime) 등 유지·추가
-- RLS 정책은 변경하지 않습니다 (authenticated/admin write 유지).
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
    'video/m4v'
  ]
where id = 'product-images';

-- Verify (allowed_mime_types 에 video/quicktime 포함 여부 확인)
select id, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'product-images';
