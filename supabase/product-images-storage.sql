-- TWOTWOSHOP product image storage (run in Supabase SQL Editor)
-- Bucket: product-images (public read for storefront, authenticated admin write)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  524288000,
  array[
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
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

drop policy if exists "Authenticated upload product images" on storage.objects;
create policy "Authenticated upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');

drop policy if exists "Authenticated update product images" on storage.objects;
create policy "Authenticated update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

drop policy if exists "Authenticated delete product images" on storage.objects;
create policy "Authenticated delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images');
