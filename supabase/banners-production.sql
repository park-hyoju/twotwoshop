-- =============================================================================
-- TWOTWOSHOP: Banner management (production setup)
-- =============================================================================
-- Run in Supabase SQL Editor after schema.sql / is_admin() exists.
-- Includes: banners table, banner-images storage bucket, hardened RLS.
--
-- DB columns (URLs stored in desktop_image / mobile_image):
--   title, description, button_text, button_link,
--   desktop_image, mobile_image, sort_order, is_active
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) banners table
-- -----------------------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  button_text text not null default '',
  button_link text not null default '/products',
  desktop_image text,
  mobile_image text,
  eyebrow text,
  headline text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.banners is
  '메인 페이지 히어로 배너. 관리자가 등록·순서·노출을 관리합니다.';

create index if not exists banners_active_sort_idx
  on public.banners (is_active, sort_order, created_at);

drop trigger if exists banners_set_updated_at on public.banners;
create trigger banners_set_updated_at
  before update on public.banners
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2) banner-images storage bucket
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3) RLS — banners (admin write, storefront read active only)
-- -----------------------------------------------------------------------------
alter table public.banners enable row level security;

revoke all on table public.banners from anon;
revoke insert, update, delete on table public.banners from anon;
grant select on table public.banners to anon, authenticated;
grant insert, update, delete on table public.banners to authenticated;

drop policy if exists "banners_select" on public.banners;
drop policy if exists "banners_insert" on public.banners;
drop policy if exists "banners_update" on public.banners;
drop policy if exists "banners_delete" on public.banners;
drop policy if exists "banners_select_storefront" on public.banners;
drop policy if exists "banners_insert_admin_role" on public.banners;
drop policy if exists "banners_update_admin_role" on public.banners;
drop policy if exists "banners_delete_admin_role" on public.banners;

create policy "banners_select_storefront"
  on public.banners for select to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "banners_insert_admin_role"
  on public.banners for insert to authenticated
  with check (public.is_admin());

create policy "banners_update_admin_role"
  on public.banners for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "banners_delete_admin_role"
  on public.banners for delete to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4) RLS — banner-images storage (public read, admin write)
-- -----------------------------------------------------------------------------
drop policy if exists "Public read banner images" on storage.objects;
create policy "Public read banner images"
on storage.objects for select to public
using (bucket_id = 'banner-images');

drop policy if exists "Authenticated upload banner images" on storage.objects;
drop policy if exists "Authenticated update banner images" on storage.objects;
drop policy if exists "Authenticated delete banner images" on storage.objects;
drop policy if exists "Admin upload banner images" on storage.objects;
drop policy if exists "Admin update banner images" on storage.objects;
drop policy if exists "Admin delete banner images" on storage.objects;

create policy "Admin upload banner images"
on storage.objects for insert to authenticated
with check (bucket_id = 'banner-images' and public.is_admin());

create policy "Admin update banner images"
on storage.objects for update to authenticated
using (bucket_id = 'banner-images' and public.is_admin())
with check (bucket_id = 'banner-images' and public.is_admin());

create policy "Admin delete banner images"
on storage.objects for delete to authenticated
using (bucket_id = 'banner-images' and public.is_admin());

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- select id, title, sort_order, is_active from public.banners order by sort_order;
-- select id, name, public from storage.buckets where id = 'banner-images';
