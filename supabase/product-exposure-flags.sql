-- =============================================================================
-- TWOTWOSHOP: Product exposure flags (is_new / is_best / is_sale)
-- =============================================================================
-- schema.sql 이전 버전에 컬럼이 없을 때 안전하게 추가합니다.
-- =============================================================================

alter table public.products
  add column if not exists is_new boolean not null default false;

alter table public.products
  add column if not exists is_best boolean not null default false;

alter table public.products
  add column if not exists is_sale boolean not null default false;

comment on column public.products.is_new is '관리자 지정 신상품 노출 플래그';
comment on column public.products.is_best is '관리자 지정 인기상품 노출 플래그';
comment on column public.products.is_sale is '관리자 지정 특가상품 노출 플래그';
