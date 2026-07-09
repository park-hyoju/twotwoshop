/**
 * P0 저장 안정화 — 로컬 브라우저 E2E (Playwright)
 *
 * @see docs/p0-save-browser-test.md
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ENV_LOCAL_EXAMPLE = `# .env.local (프로젝트 루트)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# P0 관리자 상품 저장 브라우저 E2E
ADMIN_TEST_EMAIL=admintwotwo@twotwoshop.com
ADMIN_TEST_PASSWORD=your-admin-password
`

function loadEnv() {
  const env = {}
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(resolve(process.cwd(), file), 'utf8')
      for (const line of raw.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) {
          continue
        }
        const index = trimmed.indexOf('=')
        if (index <= 0) {
          continue
        }
        env[trimmed.slice(0, index)] = trimmed.slice(index + 1)
      }
    } catch {
      // ignore missing file
    }
  }
  return { ...env, ...process.env }
}

function isBlank(value) {
  return !value || !String(value).trim()
}

function collectMissingLoginEnv(env) {
  const missing = []

  if (isBlank(env.ADMIN_TEST_EMAIL)) {
    missing.push('ADMIN_TEST_EMAIL')
  }

  const password = env.ADMIN_TEST_PASSWORD ?? env.AUTH_ADMIN_PASSWORD
  if (isBlank(password)) {
    missing.push('ADMIN_TEST_PASSWORD')
  }

  return missing
}

function printEnvHelp(missing) {
  console.error('')
  console.error('P0 저장 안정화 브라우저 E2E — 필요한 환경변수가 없습니다.')
  console.error('')

  if (missing.length > 0) {
    console.error('누락된 변수:')
    for (const key of missing) {
      console.error(`  - ${key}`)
    }
    console.error('')
  }

  console.error('필수 (관리자 로그인):')
  console.error('  ADMIN_TEST_EMAIL       Supabase Auth 이메일')
  console.error('                         예: admintwotwo@twotwoshop.com')
  console.error('  ADMIN_TEST_PASSWORD    관리자 계정 비밀번호')
  console.error('')
  console.error('선택:')
  console.error('  P0_TEST_BASE_URL       dev 서버 URL (기본: http://localhost:5175)')
  console.error('  P0_TEST_IMAGE          테스트 이미지 경로 (기본: /tmp/p0-test-product.png)')
  console.error('')
  console.error('앱 실행에 필요 (.env.local):')
  console.error('  VITE_SUPABASE_URL')
  console.error('  VITE_SUPABASE_ANON_KEY')
  console.error('')
  console.error('.env.local 예시:')
  console.error('----------------')
  console.error(ENV_LOCAL_EXAMPLE.trimEnd())
  console.error('----------------')
  console.error('')
  console.error('실행 방법:')
  console.error('  1. npm run dev')
  console.error('  2. node scripts/p0-save-browser-test.mjs')
  console.error('')
  console.error('또는 한 줄로:')
  console.error(
    '  ADMIN_TEST_EMAIL=admintwotwo@twotwoshop.com ADMIN_TEST_PASSWORD=******** node scripts/p0-save-browser-test.mjs',
  )
  console.error('')
}

const env = loadEnv()
const missingLoginEnv = collectMissingLoginEnv(env)

if (missingLoginEnv.length > 0) {
  printEnvHelp(missingLoginEnv)
  process.exit(2)
}

const BASE = env.P0_TEST_BASE_URL ?? 'http://localhost:5175'
const ADMIN_LOGIN = env.ADMIN_TEST_EMAIL.trim()
const ADMIN_PASSWORD = (env.ADMIN_TEST_PASSWORD ?? env.AUTH_ADMIN_PASSWORD).trim()
const TEST_IMAGE = env.P0_TEST_IMAGE ?? '/tmp/p0-test-product.png'
const RUN_ID = Date.now().toString(36)
const PRODUCT_NAME = `P0저장테스트-${RUN_ID}`

const results = {
  productName: PRODUCT_NAME,
  slug: null,
  steps: [],
  checks: {},
  errors: [],
}

function log(step, ok, detail = '') {
  results.steps.push({ step, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${step}${detail ? ` — ${detail}` : ''}`)
}

function fail(message) {
  results.errors.push(message)
  console.error(`ERROR: ${message}`)
}

async function waitForSave(page) {
  await page.getByRole('button', { name: '저장', exact: true }).click()
  const toast = page.locator('text=저장되었습니다').first()
  await toast.waitFor({ state: 'visible', timeout: 60_000 })
}

async function goToStep(page, label) {
  await page.getByRole('button', { name: label }).click()
}

async function readAdminState(page) {
  await goToStep(page, '상품 정보')
  const status = await page.locator('#detail-status').inputValue()
  const price = await page.locator('#detail-price').inputValue()

  await goToStep(page, '옵션')
  await page.waitForTimeout(500)
  const stockInputs = page.locator('table tbody input[type="number"]')
  const stockCount = await stockInputs.count()
  const stocks = []
  for (let i = 0; i < stockCount; i += 1) {
    stocks.push(await stockInputs.nth(i).inputValue())
  }

  return { status, price, stocks }
}

async function readStorefront(page, slug) {
  await page.goto(`${BASE}/products/${slug}`, { waitUntil: 'networkidle' })
  const bodyText = await page.locator('body').innerText()
  const soldOut = bodyText.includes('품절') || bodyText.includes('재입고')
  const priceMatch = bodyText.match(/10[,.]?000/) ?? bodyText.match(/10000/)
  return {
    soldOut,
    priceVisible: Boolean(priceMatch),
    bodySnippet: bodyText.slice(0, 500),
  }
}

async function main() {
  if (!fs.existsSync(TEST_IMAGE)) {
    fail(`테스트 이미지 없음: ${TEST_IMAGE}`)
    console.error('')
    console.error('테스트 이미지를 만들거나 P0_TEST_IMAGE 로 경로를 지정하세요.')
    console.error('  node -e "require(\'fs\').writeFileSync(\'/tmp/p0-test-product.png\', Buffer.from(\'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==\',\'base64\'))"')
    process.exit(2)
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' })
    await page.fill('#admin-login-id', ADMIN_LOGIN)
    await page.fill('#admin-password', ADMIN_PASSWORD)
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30_000 })
    log('관리자 로그인', true, ADMIN_LOGIN)

    await page.goto(`${BASE}/admin/products`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: '상품 추가' }).click()
    await page.getByText('상품 등록').first().waitFor({ timeout: 30_000 })
    log('상품 생성(에디터 열림)', true)

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(TEST_IMAGE)
    await page.getByRole('button', { name: '원본 그대로 사용' }).click({ timeout: 15_000 })
    await page.waitForFunction(
      () => !document.body.innerText.includes('업로드 중'),
      null,
      { timeout: 90_000 },
    )
    log('대표 이미지 업로드', true)

    await goToStep(page, '상품 정보')
    await page.fill('#detail-name', PRODUCT_NAME)
    await page.fill('#detail-price', '10000')
    await page.selectOption('#detail-status', 'active')

    await goToStep(page, '옵션')
    const addOptionBtn = page.getByRole('button', { name: '+ 옵션 추가' })
    if (await addOptionBtn.isVisible()) {
      await addOptionBtn.click()
    }
    const nameInputs = page.locator('input[placeholder="색상"], input[placeholder="사이즈"]')
    await nameInputs.first().fill('색상')
    await page.locator('input[placeholder="블랙, 화이트, 레드"]').first().fill('블랙, 화이트')
    await page.waitForTimeout(600)
    const stockInputs = page.locator('table tbody input[type="number"]')
    await stockInputs.first().waitFor({ state: 'visible', timeout: 15_000 })
    const variantCount = await stockInputs.count()
    for (let i = 0; i < variantCount; i += 1) {
      await stockInputs.nth(i).fill(i === 0 ? '5' : '3')
    }
    log('옵션/재고 입력', true, `variants=${variantCount}, stocks=5,3`)

    await waitForSave(page)
    log('초기 저장(가격 10000 + 옵션재고)', true)

    const afterInitial = await readAdminState(page)
    results.checks.afterInitialSave = afterInitial

    await goToStep(page, '상세페이지')
    const desc = `P0 상세설명 수정 ${RUN_ID}`
    await page.locator('#detail-description').fill(desc)
    await waitForSave(page)
    log('상세설명만 수정 후 저장', true, desc)

    await page.reload({ waitUntil: 'networkidle' })
    await page.getByText(PRODUCT_NAME).first().waitFor({ timeout: 30_000 })
    log('브라우저 새로고침', true)

    const afterRefresh = await readAdminState(page)
    results.checks.afterRefresh = afterRefresh

    await goToStep(page, '상품 정보')
    const slugInput = page.locator('#detail-slug')
    if (await slugInput.count()) {
      results.slug = await slugInput.inputValue()
    }

    if (results.slug) {
      results.checks.storefront = await readStorefront(page, results.slug)
    } else {
      await page.goto(`${BASE}/admin/products`, { waitUntil: 'networkidle' })
      await page.getByText(PRODUCT_NAME).first().click()
      await goToStep(page, '상품 정보')
      results.slug = (await page.locator('#detail-slug').inputValue()) || null
      if (results.slug) {
        results.checks.storefront = await readStorefront(page, results.slug)
      }
    }

    const soldOutOk = afterRefresh.status !== 'soldout'
    const priceOk = afterRefresh.price === '10000'
    const stocksOk =
      afterRefresh.stocks.length >= 2 &&
      afterRefresh.stocks[0] === '5' &&
      afterRefresh.stocks[1] === '3'

    results.checks.pass = {
      notSoldOut: soldOutOk,
      priceKept: priceOk,
      optionStockKept: stocksOk,
      storefrontOk: results.checks.storefront
        ? !results.checks.storefront.soldOut && results.checks.storefront.priceVisible
        : null,
    }

    log('품절 아님', soldOutOk, `status=${afterRefresh.status}`)
    log('가격 10000 유지', priceOk, `price=${afterRefresh.price}`)
    log('옵션 재고 유지', stocksOk, `stocks=${afterRefresh.stocks.join(',')}`)
    if (results.checks.storefront) {
      log(
        '쇼핑몰 표시',
        results.checks.pass.storefrontOk,
        JSON.stringify(results.checks.storefront),
      )
    } else {
      log('쇼핑몰 표시', false, 'slug 확인 불가')
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
    try {
      await page.screenshot({ path: '/tmp/p0-save-test-failure.png', fullPage: true })
      results.screenshot = '/tmp/p0-save-test-failure.png'
    } catch {
      // ignore
    }
  } finally {
    await browser.close()
  }

  const outPath = '/tmp/p0-save-browser-test-result.json'
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`\nRESULT_JSON: ${outPath}`)
  console.log(JSON.stringify(results, null, 2))

  const allPass =
    results.checks.pass &&
    results.checks.pass.notSoldOut &&
    results.checks.pass.priceKept &&
    results.checks.pass.optionStockKept &&
    results.checks.pass.storefrontOk !== false

  process.exit(allPass && results.errors.length === 0 ? 0 : 1)
}

main()
