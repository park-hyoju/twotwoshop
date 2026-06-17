# TWOTWOSHOP Supabase Schema (v0.8.0 Step 1)

이 폴더는 **Supabase 실제 연결 전** 데이터베이스 설계를 담습니다.  
React 앱 코드는 변경하지 않으며, `schema.sql`을 Supabase에 적용하는 것이 다음 단계입니다.

---

## 파일

| 파일 | 설명 |
|------|------|
| `schema.sql` | 테이블, 인덱스, RLS 초안, 주석 |
| `seed-products.sql` | `src/data/products.ts` 22개 상품 seed (slug upsert) |
| `README.md` | 설계 의도 및 다음 단계 가이드 |

---

## 테이블 개요

### `products` — 상품 마스터

쇼핑몰에 노출되는 모든 상품의 기준 데이터입니다.

- 프론트 `Product` 타입(v0.3)과 필드가 대응됩니다.
- `slug`는 URL(`/products/:slug`)과 연결됩니다.
- `price`, `stock`은 **서버에서 재검증**해야 하는 핵심 필드입니다.
- `status = 'active'`인 행만 고객에게 공개합니다(RLS).

**왜 필요한가**  
현재는 `src/data/products.ts` 정적 배열을 사용합니다. 운영 시 Admin에서 상품을 등록·수정·품절 처리하려면 DB 마스터가 필요합니다.

---

### `customers` — 비회원 고객

Guest Checkout에서 수집하는 이름·연락처·주소입니다.

- Auth(회원) 없이도 주문을 받기 위한 최소 고객 엔티티입니다.
- `orders`와 `customer_id`로 연결되며, 주문 행에도 스냅샷이 복제됩니다.

**왜 필요한가**  
주문 이력과 고객 정보를 분리하면, 향후 회원 가입 시 `customers` ↔ `auth.users` 연동, 재주문, CS 조회가 쉬워집니다.

---

### `orders` — 주문 헤더

한 번의 주문 접수 단위입니다.

- `order_number`: 고객에게 보여주는 번호 (앱의 `Order.orderNumber`)
- `subtotal` / `shipping_fee` / `total_amount`: 금액 합계
- `status`: 접수 → 확인 → 입금 → 배송 → 완료/취소
- 배송지·연락처는 주문 시점 스냅샷으로 `orders`에도 저장

**프론트 매핑 (v0.6)**

| 앱 (`Order`) | DB (`orders`) |
|--------------|---------------|
| `orderNumber` | `order_number` |
| `customerName` | `customer_name` |
| `phone` | `customer_phone` |
| `shipping.postalCode` | `zipcode` |
| `shipping.address` | `address1` |
| `shipping.addressDetail` | `address2` |
| `shipping.memo` | `memo` |
| `productTotal` | `subtotal` |
| `shippingFee` | `shipping_fee` |
| `totalAmount` | `total_amount` |

---

### `order_items` — 주문 상품 상세

주문에 포함된 각 상품 라인입니다.

- `product_id`는 참조용 FK (상품 삭제 시 `SET NULL`, 스냅샷은 유지)
- `product_name`, `unit_price`, `quantity`는 **주문 당시 스냅샷**
- `total_price = unit_price × quantity` (CHECK 제약)

**프론트 매핑 (v0.6)**

| 앱 (`OrderItem`) | DB (`order_items`) |
|------------------|---------------------|
| `productId` | `product_id` |
| `slug` | `product_slug` |
| `name` | `product_name` |
| `price` | `unit_price` |
| `quantity` | `quantity` |
| `price × quantity` | `total_price` |

---

## ER 관계

```
customers (1) ──< (N) orders (1) ──< (N) order_items
                                              │
                                              └──> (N) products (optional FK)
```

1. Checkout 시 `customers` insert (또는 기존 고객 reuse — v0.8+ 로직)
2. `orders` insert (`customer_id`, 금액·배송 스냅샷)
3. `order_items` insert (각 장바구니 상품)

`ON DELETE CASCADE` on `order_items.order_id`: 주문 삭제 시 라인 아이템 자동 삭제 (운영 정책에 따라 soft delete로 변경 가능).

---

## 인덱스

| 인덱스 | 용도 |
|--------|------|
| `products(slug)` | 상세 페이지 조회 |
| `products(status)` | active 상품 목록 |
| `products(display_category)` | 카테고리 목록 |
| `products(detail_category)` | 세부 카테고리/Admin |
| `orders(order_number)` | 주문번호 조회 |
| `orders(customer_phone)` | CS 전화번호 검색 |
| `order_items(order_id)` | 주문 상세 조회 |

---

## RLS 정책 (초안)

| 테이블 | SELECT | INSERT | 비고 |
|--------|--------|--------|------|
| `products` | ✅ `status = 'active'`만 | ❌ (정책 없음) | Admin/service_role로 상품 관리 예정 |
| `customers` | ❌ | ✅ anon/authenticated | 개인정보 노출 방지 |
| `orders` | ❌ | ✅ anon/authenticated | 고객 주문 접수만 허용 |
| `order_items` | ❌ | ✅ anon/authenticated | 주문 라인 저장만 허용 |

### 알려진 한계 (의도적)

- **anon INSERT 전면 허용**은 MVP 초안입니다. 스팸 주문·가격 조작 방지를 위해 v0.8 Step 2+에서 **Edge Function 또는 RPC**로 서버 검증 후 insert 권장.
- **SELECT 금지**이므로 주문 완료 화면은 당분간 클라이언트 state/localStorage + insert 반환값(`order_number`) 조합이 필요합니다.
- **관리자 SELECT/UPDATE** 정책은 Auth 도입 후 추가합니다.

---

## Supabase SQL 적용 순서

아래 순서대로 **SQL Editor**에서 실행하세요.

### 1. `schema.sql` (최초 1회, 재실행 가능)

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 → **SQL Editor**
2. **New query** → `schema.sql` 전체 붙여넣기 → **Run**
3. **Table Editor** → `public` 스키마에서 4개 테이블 생성 확인
4. **Authentication → Policies**에서 RLS 정책 확인

`schema.sql`은 idempotent하게 작성되어 있어 오류 수정 후 **여러 번 실행해도 안전**합니다.

### 2. `seed-products.sql` (`schema.sql` 이후)

1. SQL Editor → **New query**
2. `seed-products.sql` 전체 붙여넣기 → **Run**
3. `Success. No rows returned` 확인

**재실행 가능 여부:** `ON CONFLICT (slug) DO UPDATE`를 사용하므로 **여러 번 실행해도 안전**합니다. 동일 slug가 있으면 최신 seed 값으로 갱신됩니다.

### 3. `products` 테이블 데이터 확인

1. **Table Editor** → `products` 테이블 선택
2. **22행**이 있는지 확인 (`slug` 기준)
3. `status`, `price`, `display_category`, `is_best` 등 컬럼 값 확인

SQL로 확인하려면:

```sql
select slug, name, status, price, display_category
from public.products
order by display_order;
```

> **참고:** RLS 정책상 anon 클라이언트는 `status = 'active'` 행만 SELECT합니다. `soldout` 상품 2개는 Table Editor(service role)에서는 보이지만 storefront API 응답에는 포함되지 않습니다.

로컬 CLI 사용 시 (선택):

```bash
# Supabase CLI 설치 후
supabase init
supabase db push
```

---

## 다음 단계 (v0.8.0 Step 4+)

1. **UI → productRepository 연결** — 페이지/훅에서 `productService` 대신 `productRepository` async 호출
2. **Row 매퍼 (Order)** — `Order` ↔ `orders` + `order_items` 변환 함수
3. **orderRepository Supabase 연동** — `orderRepository`에서 Supabase insert
4. **주문 RPC** — 가격·재고 서버 검증 + transaction insert (customers → orders → order_items)
5. **재고 차감** — 주문 확정 시 `products.stock` 감소
6. **환경변수** — Vercel에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정
7. **RLS 강화** — anon 직접 insert 제한, Edge Function + service_role 조합
8. **Admin 정책** — authenticated 관리자 role용 SELECT/UPDATE/INSERT

---

## 기존 앱 영향

- **v0.8.0 Step 3**까지 UI(Cart / Checkout / Order)는 변경하지 않습니다.
- 페이지·훅은 여전히 `productService` + `src/data/products.ts`를 사용합니다.
- `productRepository`는 Supabase 연동이 준비되었으며, Step 4에서 UI에 연결합니다.
- `.env.local`이 없어도 앱은 정적 데이터로 정상 동작합니다.
