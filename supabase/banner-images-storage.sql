-- TWOTWOSHOP banner image storage (run in Supabase SQL Editor)
-- Bucket: banner-images (public read for storefront, authenticated admin write)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'banner-images',
  'banner-images',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read banner images" on storage.objects;
create policy "Public read banner images"
on storage.objects
for select
to public
using (bucket_id = 'banner-images');

drop policy if exists "Authenticated upload banner images" on storage.objects;
create policy "Authenticated upload banner images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'banner-images');

drop policy if exists "Authenticated update banner images" on storage.objects;
create policy "Authenticated update banner images"
on storage.objects
for update
to authenticated
using (bucket_id = 'banner-images')
with check (bucket_id = 'banner-images');

drop policy if exists "Authenticated delete banner images" on storage.objects;
create policy "Authenticated delete banner images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'banner-images');
