-- =============================================================================
-- TWOTWOSHOP: Product Detail columns (v0.9.3)
-- =============================================================================
-- 목적: Admin 상품 상세 관리용 확장 컬럼
-- 적용: schema.sql + admin-products-rls.sql 이후 SQL Editor에서 실행
-- 특징: idempotent — 여러 번 실행해도 안전, 기존 데이터 유지
-- =============================================================================

alter table public.products add column if not exists brand text;
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists meta_title text;
alter table public.products add column if not exists meta_description text;
alter table public.products add column if not exists size_guide jsonb default '{"rows":[],"model_info":""}'::jsonb;
alter table public.products add column if not exists product_info jsonb default '{}'::jsonb;
alter table public.products add column if not exists shipping_info jsonb default '{}'::jsonb;
alter table public.products add column if not exists return_info jsonb default '{}'::jsonb;

comment on column public.products.brand is '브랜드명';
comment on column public.products.sku is '상품코드(SKU)';
comment on column public.products.meta_title is 'SEO Meta Title';
comment on column public.products.meta_description is 'SEO Meta Description';
comment on column public.products.size_guide is '사이즈 가이드 JSON { rows: [...], model_info: "" }';
comment on column public.products.product_info is '상품 정보 JSON (소재, 제조국 등)';
comment on column public.products.shipping_info is '배송 안내 JSON';
comment on column public.products.return_info is '교환/환불 안내 JSON';
