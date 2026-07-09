# P0 관리자 상품 저장 — 브라우저 E2E 테스트

관리자 상품관리 저장 안정화(P0)가 실제 브라우저에서 정상 동작하는지 Playwright로 검증합니다.

## 사전 준비

1. **의존성** (최초 1회)

   ```bash
   npm install --no-save playwright
   npx playwright install chromium
   ```

2. **로컬 dev 서버 실행**

   ```bash
   npm run dev
   ```

   기본 URL은 `http://localhost:5175` 입니다. 포트가 다르면 `P0_TEST_BASE_URL` 로 지정하세요.

3. **환경변수** — `.env.local` 또는 셸에 설정

## 필수 환경변수

| 변수 | 설명 |
|------|------|
| `ADMIN_TEST_EMAIL` | Supabase Auth 관리자 이메일 (예: `admintwotwo@twotwoshop.com`) |
| `ADMIN_TEST_PASSWORD` | 관리자 계정 비밀번호 |

## 선택 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `P0_TEST_BASE_URL` | `http://localhost:5175` | Vite dev 서버 URL |
| `P0_TEST_IMAGE` | `/tmp/p0-test-product.png` | 상품 등록용 테스트 이미지 |

## `.env.local` 예시

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# P0 브라우저 E2E
ADMIN_TEST_EMAIL=admintwotwo@twotwoshop.com
ADMIN_TEST_PASSWORD=your-admin-password
```

## 실행

```bash
node scripts/p0-save-browser-test.mjs
```

한 줄로 실행:

```bash
ADMIN_TEST_EMAIL=admintwotwo@twotwoshop.com ADMIN_TEST_PASSWORD=******** node scripts/p0-save-browser-test.mjs
```

## 검증 시나리오

1. 상품 생성
2. 판매가 10,000원 + 옵션 재고 저장
3. 상세설명만 수정 후 저장
4. 브라우저 새로고침
5. 품절 아님 / 가격 유지 / 옵션 재고 유지
6. 고객 쇼핑몰 상품 상세 페이지 표시 확인

## 결과

- 콘솔에 단계별 `PASS` / `FAIL` 출력
- JSON 결과: `/tmp/p0-save-browser-test-result.json`
- 실패 시 스크린샷: `/tmp/p0-save-test-failure.png`

## 환경변수 누락 시

스크립트가 **누락된 변수만** 목록으로 출력하고 종료합니다 (exit code `2`).

예:

```
누락된 변수:
  - ADMIN_TEST_EMAIL
  - ADMIN_TEST_PASSWORD
```
