-- =============================================================================
-- TWOTWOSHOP Supabase Schema (v0.8.0 Step 1)
-- =============================================================================
-- 목적: Guest Checkout + 상품 조회를 위한 최소 운영 스키마
-- 적용: Supabase SQL Editor 또는 `supabase db push` 로 실행
-- 주의: 이 파일은 설계/초안입니다. 프로덕션 적용 전 RLS·권한을 재검토하세요.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
-- UUID 생성에 사용합니다. Supabase 프로젝트에는 기본 활성화되어 있는 경우가 많습니다.
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Helper: products.updated_at 자동 갱신
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'UPDATE 시 updated_at 컬럼을 현재 시각으로 자동 갱신합니다.';

-- =============================================================================
-- products
-- =============================================================================
-- 쇼핑몰에 노출되는 상품 마스터 테이블입니다.
-- 프론트엔드 Product Domain(v0.3)과 1:1로 매핑되도록 설계했습니다.
-- 가격은 원 단위 정수(KRW)로 저장합니다.
-- =============================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_description text,
  description text,
  price integer not null check (price >= 0),
  original_price integer check (original_price is null or original_price >= 0),
  discount_rate integer default 0 check (discount_rate >= 0 and discount_rate <= 100),
  thumbnail text,
  images text[] default '{}',
  gender text,
  display_category text,
  detail_category text,
  tags text[] default '{}',
  is_new boolean not null default false,
  is_best boolean not null default false,
  is_sale boolean not null default false,
  stock integer not null default 0 check (stock >= 0),
  display_order integer not null default 0,
  status text not null default 'active'
    check (status in ('active', 'hidden', 'soldout')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is
  '상품 마스터. 고객 화면·장바구니·주문 스냅샷의 기준 데이터입니다.';

comment on column public.products.slug is
  'URL 경로용 고유 식별자. 예: /products/classic-linen-shirt';

comment on column public.products.price is
  '판매가(원). Checkout 시 서버에서 반드시 재검증해야 합니다.';

comment on column public.products.stock is
  '판매 가능 재고 수량. 주문 확정 시 차감 로직(v0.8+)이 필요합니다.';

comment on column public.products.display_order is
  '목록/홈 섹션 정렬 우선순위. 값이 작을수록 앞에 노출합니다.';

comment on column public.products.status is
  'active=노출, hidden=비노출, soldout=품절 표시. 고객 SELECT는 active만 허용(RLS).';

drop trigger if exists products_set_updated_at on public.products;

create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- customers
-- =============================================================================
-- 비회원(Guest) 주문 시 수집하는 고객 정보입니다.
-- v0.6 Guest Checkout에서는 주문서에 고객 정보가 포함되며,
-- DB에서는 고객 레코드와 주문 레코드를 분리해 향후 회원 연동·재주문 분석에 대비합니다.
-- =============================================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  zipcode text,
  address1 text,
  address2 text,
  created_at timestamptz not null default now()
);

comment on table public.customers is
  '비회원 고객 정보. 주문 시 스냅샷을 orders에도 복제해 이력을 보존합니다.';

comment on column public.customers.phone is
  '연락처. 주문 조회·CS 연락에 사용. 개인정보이므로 SELECT RLS를 엄격히 관리합니다.';

-- =============================================================================
-- orders
-- =============================================================================
-- 주문 헤더 테이블입니다.
-- 고객/배송 정보는 customer_id FK와 함께 주문 시점 스냅샷 컬럼을 둡니다.
-- (고객 정보 변경 후에도 과거 주문 내역이 유지되도록)
-- =============================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid references public.customers (id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  zipcode text,
  address1 text,
  address2 text,
  memo text,
  subtotal integer not null check (subtotal >= 0),
  shipping_fee integer not null check (shipping_fee >= 0),
  total_amount integer not null check (total_amount >= 0),
  status text not null default 'pending_payment'
    check (status in (
      'pending_payment',
      'payment_confirmed',
      'preparing',
      'shipping',
      'delivered',
      'cancel_requested',
      'cancelled'
    )),
  payment_status text not null default 'waiting_deposit'
    check (payment_status in ('waiting_deposit', 'paid', 'refunded')),
  created_at timestamptz not null default now()
);

comment on table public.orders is
  '주문 헤더. 결제/배송 상태와 금액 합계를 관리합니다.';

comment on column public.orders.order_number is
  '고객에게 보여주는 주문번호. 예: TT-20260617-123456. 서버에서 생성 권장.';

comment on column public.orders.subtotal is
  '상품 합계(원). 프론트 Order.productTotal과 매핑됩니다.';

comment on column public.orders.status is
  'pending_payment=입금대기, payment_confirmed=입금확인, preparing=배송준비, shipping=배송중, delivered=배송완료, cancel_requested=취소요청, cancelled=취소완료';

-- =============================================================================
-- order_items
-- =============================================================================
-- 주문 상품 라인 아이템입니다.
-- 주문 시점의 상품명·단가를 스냅샷으로 저장해 이후 상품 가격 변경과 무관하게
-- 주문 내역을 재현할 수 있게 합니다.
-- =============================================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_slug text,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  total_price integer not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

comment on table public.order_items is
  '주문 상품 상세. product_id는 참조용, 실제 표시는 스냅샷 컬럼을 사용합니다.';

comment on column public.order_items.product_slug is
  '주문 당시 slug 스냅샷. product 삭제 후에도 주문 내역 복원에 사용합니다.';

comment on column public.order_items.unit_price is
  '주문 당시 단가(원). 클라이언트 가격을 신뢰하지 말고 서버에서 재검증 후 저장합니다.';

-- -----------------------------------------------------------------------------
-- Named CHECK constraints (idempotent)
-- CREATE TABLE IF NOT EXISTS 는 테이블이 이미 있으면 본문을 건너뛰므로,
-- 명명된 제약은 별도로 존재 여부를 확인한 뒤 추가합니다.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_total_amount_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_total_amount_check
      check (total_amount = subtotal + shipping_fee);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_total_price_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_total_price_check
      check (total_price = unit_price * quantity);
  end if;
end;
$$;

-- =============================================================================
-- Indexes
-- =============================================================================
create index if not exists idx_products_slug
  on public.products (slug);

create index if not exists idx_products_status
  on public.products (status);

create index if not exists idx_products_display_category
  on public.products (display_category);

create index if not exists idx_products_detail_category
  on public.products (detail_category);

create index if not exists idx_orders_order_number
  on public.orders (order_number);

create index if not exists idx_orders_customer_phone
  on public.orders (customer_phone);

create index if not exists idx_order_items_order_id
  on public.order_items (order_id);

-- =============================================================================
-- Row Level Security (RLS) — 초안
-- =============================================================================
-- 방향:
--   - products: 누구나(active) 조회 가능
--   - customers / orders / order_items: anon INSERT만 허용, SELECT 금지
--
-- 주의:
--   - 아래 정책은 Guest Checkout MVP 단계용 초안입니다.
--   - 관리자(authenticated service_role) 정책은 v0.9+에서 별도 추가합니다.
--   - anon INSERT 허용 시 악의적 대량 insert 가능 → Rate Limit/Edge Function 검토 필요.
-- =============================================================================

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Guest Checkout INSERT용 API 역할 권한
grant usage on schema public to anon, authenticated;

grant insert on table public.customers to anon, authenticated;
grant insert on table public.orders to anon, authenticated;
grant insert on table public.order_items to anon, authenticated;

-- products: active 상품만 공개 조회
drop policy if exists "products_select_active_anon" on public.products;

create policy "products_select_active_anon"
  on public.products
  for select
  to anon, authenticated
  using (status = 'active');

-- customers: 비회원 주문 시 insert만 허용
drop policy if exists "customers_insert_anon" on public.customers;

create policy "customers_insert_anon"
  on public.customers
  for insert
  to anon, authenticated
  with check (true);

-- orders: 비회원 주문 접수 insert만 허용
drop policy if exists "orders_insert_anon" on public.orders;

create policy "orders_insert_anon"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

-- order_items: 주문 상품 insert만 허용
drop policy if exists "order_items_insert_anon" on public.order_items;

create policy "order_items_insert_anon"
  on public.order_items
  for insert
  to anon, authenticated
  with check (true);

-- =============================================================================
-- (선택) service_role / 관리자용 정책은 아직 추가하지 않습니다.
-- Supabase Dashboard 또는 v0.9 Admin 작업 시 authenticated + role claim 기반으로 확장합니다.
-- =============================================================================
