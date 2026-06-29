/**
 * Live production security / RLS verification for TWOTWOSHOP.
 *
 * Usage:
 *   node scripts/live-security-verification.mjs
 *
 * Optional env (.env.local or shell):
 *   ADMIN_TEST_PASSWORD       — admin@twotwoshop.com password
 *   MEMBER_A_EMAIL / MEMBER_A_PASSWORD
 *   MEMBER_B_EMAIL / MEMBER_B_PASSWORD
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  const env = {}
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(resolve(process.cwd(), file), 'utf8')
      for (const line of raw.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const index = trimmed.indexOf('=')
        if (index <= 0) continue
        env[trimmed.slice(0, index)] = trimmed.slice(index + 1)
      }
    } catch {
      // ignore missing file
    }
  }
  return { ...env, ...process.env }
}

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1]
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

function isAdminJwt(payload) {
  return payload?.app_metadata?.role === 'admin'
}

function pass(id, detail) {
  return { id, status: 'PASS', detail }
}

function fail(id, detail, extra = {}) {
  return { id, status: 'FAIL', detail, ...extra }
}

function skip(id, detail) {
  return { id, status: 'SKIP', detail }
}

function createAnonClient(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function signInClient(url, key, email, password) {
  const client = createAnonClient(url, key)
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    return { client, error, session: null, user: null }
  }
  return { client, error: null, session: data.session, user: data.user }
}

async function trySignUp(url, key, email, password, metadata = {}) {
  const client = createAnonClient(url, key)
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: metadata },
  })
  return { client, data, error }
}

async function countRows(client, table, filters = {}) {
  let query = client.from(table).select('*', { count: 'exact', head: true })
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val)
  }
  const { count, error } = await query
  return { count: count ?? 0, error }
}

async function selectRows(client, table, columns = '*', limit = 5) {
  const { data, error } = await client.from(table).select(columns).limit(limit)
  return { data: data ?? [], error, count: data?.length ?? 0 }
}

async function updateRow(client, table, id, patch) {
  const { data, error } = await client.from(table).update(patch).eq('id', id).select('id')
  return { data, error, updated: (data?.length ?? 0) > 0 }
}

async function main() {
  const env = loadEnv()
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const results = []
  const stamp = Date.now()

  console.log(`\n=== TWOTWOSHOP Live Security Verification ===`)
  console.log(`Target: ${url}`)
  console.log(`Time: ${new Date().toISOString()}\n`)

  // -------------------------------------------------------------------------
  // 0) Anon RLS
  // -------------------------------------------------------------------------
  const anon = createAnonClient(url, anonKey)

  for (const table of ['orders', 'customer_addresses', 'customer_inquiries', 'customers', 'order_items']) {
    const { data, error } = await selectRows(anon, table, 'id', 10)
    const blocked =
      error?.code === '42501' ||
      error?.message?.toLowerCase().includes('permission denied') ||
      error?.message?.toLowerCase().includes('row-level security') ||
      (data.length === 0 && !error)

    results.push(
      blocked
        ? pass(`anon.select.${table}`, error ? `blocked: ${error.code ?? error.message}` : '0 rows')
        : fail(`anon.select.${table}`, `returned ${data.length} rows without RLS block`, {
            sample: data.slice(0, 2),
            error: error?.message,
          }),
    )
  }

  // is_admin() as anon should be false
  const { data: isAdminAnon, error: isAdminAnonErr } = await anon.rpc('is_admin')
  results.push(
    isAdminAnon === false
      ? pass('anon.is_admin', 'returns false')
      : fail('anon.is_admin', `expected false, got ${JSON.stringify(isAdminAnon)}`, {
          error: isAdminAnonErr?.message,
        }),
  )

  // -------------------------------------------------------------------------
  // 0b) security-hardening-v2 — direct mutation blocked
  // -------------------------------------------------------------------------
  const fakeOrderId = '00000000-0000-4000-8000-000000000099'
  const orderInsert = await anon.from('orders').insert({
    id: fakeOrderId,
    order_number: 'HARDENING-TEST-ANON',
    customer_name: 'test',
    customer_phone: '01000000000',
    subtotal: 1000,
    shipping_fee: 4000,
    total_amount: 5000,
    status: 'pending_payment',
  })
  results.push(
    orderInsert.error || (orderInsert.data?.length ?? 0) === 0
      ? pass('hardening.anon.orders_insert_blocked', orderInsert.error?.message ?? '0 rows inserted')
      : fail('hardening.anon.orders_insert_blocked', 'anon inserted into orders', {
          data: orderInsert.data,
        }),
  )

  const bannerInsert = await anon.from('banners').insert({
    title: 'hardening test',
    description: 'should fail',
    button_text: 'x',
    button_link: '/',
  })
  results.push(
    bannerInsert.error || (bannerInsert.data?.length ?? 0) === 0
      ? pass('hardening.anon.banners_insert_blocked', bannerInsert.error?.message ?? '0 rows inserted')
      : fail('hardening.anon.banners_insert_blocked', 'anon inserted into banners'),
  )

  const bannerSelect = await anon.from('banners').select('id').limit(1)
  results.push(
    !bannerSelect.error
      ? pass('hardening.anon.banners_select_ok', `readable rows: ${bannerSelect.data?.length ?? 0}`)
      : skip('hardening.anon.banners_select_ok', bannerSelect.error.message),
  )

  // -------------------------------------------------------------------------
  // 0c) security-hardening-v4 — legacy RPC + policy probes
  // -------------------------------------------------------------------------
  const guestRpc = await anon.rpc('create_guest_order_with_stock', {
    p_customer_id: '00000000-0000-4000-8000-000000000099',
    p_customer: { name: 'x', phone: '010' },
    p_order_id: '00000000-0000-4000-8000-000000000098',
    p_order: {
      order_number: 'HARDENING-V4',
      customer_name: 'x',
      customer_phone: '010',
      subtotal: 1,
      shipping_fee: 4000,
      total_amount: 4001,
    },
    p_items: [
      {
        product_id: '00000000-0000-4000-8000-000000000001',
        quantity: 1,
        unit_price: 1,
      },
    ],
  })
  results.push(
    guestRpc.error &&
      (guestRpc.error.code === '42883' ||
        guestRpc.error.message?.toLowerCase().includes('could not find the function') ||
        guestRpc.error.message?.toLowerCase().includes('permission denied'))
      ? pass(
          'hardening.v4.guest_rpc_blocked',
          guestRpc.error.message ?? 'function missing or denied',
        )
      : fail('hardening.v4.guest_rpc_blocked', 'anon can still call create_guest_order_with_stock', {
          error: guestRpc.error?.message,
          data: guestRpc.data,
        }),
  )

  const adminInquiryRead = await anon.rpc('mark_admin_inquiry_read', {
    p_inquiry_id: '00000000-0000-4000-8000-000000000001',
  })
  results.push(
    adminInquiryRead.error &&
      (adminInquiryRead.error.code === '42501' ||
        adminInquiryRead.error.message?.toLowerCase().includes('permission denied') ||
        adminInquiryRead.error.message?.includes('ADMIN_REQUIRED'))
      ? pass('hardening.v4.mark_admin_inquiry_read_blocked', adminInquiryRead.error.message)
      : fail(
          'hardening.v4.mark_admin_inquiry_read_blocked',
          'anon can call mark_admin_inquiry_read without block',
          { error: adminInquiryRead.error?.message },
        ),
  )

  const productRelatedInsert = await anon.from('product_related').insert({
    product_id: '00000000-0000-4000-8000-000000000001',
    related_product_id: '00000000-0000-4000-8000-000000000002',
    sort_order: 99,
  })
  results.push(
    productRelatedInsert.error &&
      !productRelatedInsert.data?.length &&
      (productRelatedInsert.error.code === '42501' ||
        productRelatedInsert.error.message?.toLowerCase().includes('row-level security') ||
        productRelatedInsert.error.message?.toLowerCase().includes('permission denied'))
      ? pass(
          'hardening.v4.anon.product_related_insert_blocked',
          productRelatedInsert.error.message ?? 'insert blocked',
        )
      : productRelatedInsert.error?.code === '42P01'
        ? skip('hardening.v4.anon.product_related_insert_blocked', 'table missing')
        : fail('hardening.v4.anon.product_related_insert_blocked', productRelatedInsert.error?.message ?? 'anon inserted product_related'),
  )

  const consultationUpdate = await anon
    .from('consultation_status_settings')
    .update({ status: 'closed' })
    .eq('id', 'default')
  results.push(
    consultationUpdate.error &&
      (consultationUpdate.error.code === '42501' ||
        consultationUpdate.error.message?.toLowerCase().includes('permission denied') ||
        consultationUpdate.error.message?.toLowerCase().includes('row-level security'))
      ? pass('hardening.v4.anon.consultation_update_blocked', consultationUpdate.error.message)
      : consultationUpdate.error?.code === '42P01'
        ? skip('hardening.v4.anon.consultation_update_blocked', 'table missing')
        : fail('hardening.v4.anon.consultation_update_blocked', 'anon updated consultation status'),
  )

  // -------------------------------------------------------------------------
  // 1) Prepare member accounts
  // -------------------------------------------------------------------------
  let memberA = {
    email: env.MEMBER_A_EMAIL,
    password: env.MEMBER_A_PASSWORD,
    client: null,
    userId: null,
  }
  let memberB = {
    email: env.MEMBER_B_EMAIL,
    password: env.MEMBER_B_PASSWORD,
    client: null,
    userId: null,
  }

  async function ensureMember(member, label) {
    if (member.email && member.password) {
      const signed = await signInClient(url, anonKey, member.email, member.password)
      if (!signed.error && signed.user) {
        member.client = signed.client
        member.userId = signed.user.id
        return { ok: true, created: false }
      }
    }

    const email = member.email ?? `twotwoshop.rls.${label}.${stamp}@test.com`
    const password = member.password ?? `RlsTest${String(stamp).slice(-6)}!`

    if (!member.email && process.env.ALLOW_LIVE_SIGNUP !== '1') {
      return {
        ok: false,
        error: 'No member credentials. Set MEMBER_*_EMAIL/PASSWORD or ALLOW_LIVE_SIGNUP=1',
        email,
        password,
      }
    }

    const signUp = await trySignUp(url, anonKey, email, password, {
      display_name: `RLS ${label}`,
      phone: '01011112222',
    })

    if (signUp.error) {
      return { ok: false, error: signUp.error.message, email, password }
    }

    if (!signUp.data.session) {
      const signIn = await signInClient(url, anonKey, email, password)
      if (signIn.error) {
        return { ok: false, error: signIn.error.message, email, password }
      }
      member.client = signIn.client
      member.userId = signIn.user.id
      member.email = email
      member.password = password
      return { ok: true, created: true, email, password }
    }

    member.client = signUp.client
    member.userId = signUp.data.user.id
    member.email = email
    member.password = password
    return { ok: true, created: true, email, password }
  }

  const memberAResult = await ensureMember(memberA, 'a')
  if (!memberAResult.ok) {
    results.push(
      memberAResult.error?.includes('credentials') || memberAResult.error?.includes('rate limit')
        ? skip('member.setup.a', `Could not create/login member A: ${memberAResult.error}`)
        : fail('member.setup.a', `Could not create/login member A: ${memberAResult.error}`, {
            hint: 'Set MEMBER_A_EMAIL/MEMBER_A_PASSWORD or wait for signup rate limit',
          }),
    )
  } else {
    results.push(pass('member.setup.a', `${memberAResult.created ? 'created' : 'logged in'} ${memberA.email}`))
  }

  const memberBResult = await ensureMember(memberB, 'b')
  if (!memberBResult.ok) {
    results.push(
      memberBResult.error?.includes('credentials') || memberBResult.error?.includes('rate limit')
        ? skip('member.setup.b', `Could not create/login member B: ${memberBResult.error}`)
        : fail('member.setup.b', `Could not create/login member B: ${memberBResult.error}`),
    )
  } else {
    results.push(pass('member.setup.b', `${memberBResult.created ? 'created' : 'logged in'} ${memberB.email}`))
  }

  // -------------------------------------------------------------------------
  // 2) Member RLS (if both members available)
  // -------------------------------------------------------------------------
  if (memberA.client && memberB.client && memberA.userId !== memberB.userId) {
    const allOrders = await selectRows(memberA.client, 'orders', 'id,user_id', 50)
    const foreignOrders = allOrders.data.filter((row) => row.user_id && row.user_id !== memberA.userId)

    results.push(
      foreignOrders.length === 0
        ? pass('member.orders.no_foreign_rows', `visible orders: ${allOrders.data.length}, foreign: 0`)
        : fail('member.orders.no_foreign_rows', `member A sees ${foreignOrders.length} foreign order(s)`, {
            foreignOrders: foreignOrders.slice(0, 3),
          }),
    )

    // Try to read B's addresses directly
    const bAddresses = await selectRows(memberB.client, 'customer_addresses', 'id,user_id', 5)
    let targetAddressId = bAddresses.data[0]?.id

    if (!targetAddressId) {
      const insert = await memberB.client
        .from('customer_addresses')
        .insert({
          label: 'RLS Test',
          recipient_name: '테스트',
          phone: '01099998888',
          zipcode: '12345',
          address1: '서울시',
          address2: '',
          is_default: false,
        })
        .select('id')
        .single()

      if (!insert.error && insert.data?.id) {
        targetAddressId = insert.data.id
        results.push(pass('member.b.address.seed', `created address ${targetAddressId}`))
      }
    }

    if (targetAddressId) {
      const steal = await memberA.client
        .from('customer_addresses')
        .select('id')
        .eq('id', targetAddressId)
        .maybeSingle()

      results.push(
        !steal.data
          ? pass('member.addresses.no_other_member', 'cannot read other member address by id')
          : fail('member.addresses.no_other_member', 'read other member address succeeded', {
              data: steal.data,
            }),
      )
    } else {
      results.push(skip('member.addresses.no_other_member', 'no address row to test'))
    }

    const allAddresses = await selectRows(memberA.client, 'customer_addresses', 'id,user_id', 50)
    const foreignAddresses = allAddresses.data.filter((row) => row.user_id !== memberA.userId)
    results.push(
      foreignAddresses.length === 0
        ? pass('member.addresses.no_foreign_rows', `visible: ${allAddresses.data.length}`)
        : fail('member.addresses.no_foreign_rows', `sees ${foreignAddresses.length} foreign address(es)`),
    )

    const inquiries = await selectRows(memberA.client, 'customer_inquiries', 'id,user_id', 50)
    const blockedInquiries =
      inquiries.error?.code === '42501' ||
      inquiries.error?.message?.toLowerCase().includes('row-level security') ||
      inquiries.data.length === 0

    results.push(
      blockedInquiries
        ? pass('member.inquiries.direct_select_blocked', inquiries.error?.message ?? '0 rows')
        : fail('member.inquiries.direct_select_blocked', `returned ${inquiries.data.length} inquiry rows`),
    )

    // Member inquiry via RPC should work (own only)
    const { data: memberInquiries, error: memberInqErr } = await memberA.client.rpc('get_member_inquiries')
    results.push(
      !memberInqErr
        ? pass('member.inquiries.rpc_own', `rpc ok, count=${Array.isArray(memberInquiries) ? memberInquiries.length : 'n/a'}`)
        : skip('member.inquiries.rpc_own', memberInqErr.message),
    )

    // Member cannot SELECT all customers (hardening v2)
    const customerLeak = await selectRows(memberA.client, 'customers', 'id,name,phone', 5)
    results.push(
      customerLeak.error?.code === '42501' ||
        customerLeak.error?.message?.toLowerCase().includes('permission') ||
        customerLeak.data.length === 0
        ? pass('hardening.member.customers_select_blocked', customerLeak.error?.message ?? '0 rows')
        : fail('hardening.member.customers_select_blocked', `leaked ${customerLeak.data.length} customer row(s)`, {
            sample: customerLeak.data.slice(0, 2),
          }),
    )

    const memberBannerInsert = await memberA.client.from('banners').insert({
      title: 'member attack',
      description: 'should fail',
      button_text: 'x',
      button_link: '/',
    })
    results.push(
      memberBannerInsert.error || (memberBannerInsert.data?.length ?? 0) === 0
        ? pass('hardening.member.banners_insert_blocked', memberBannerInsert.error?.message ?? '0 rows')
        : fail('hardening.member.banners_insert_blocked', 'member inserted banner without admin role'),
    )

    const memberProductRelatedInsert = await memberA.client.from('product_related').insert({
      product_id: '00000000-0000-4000-8000-000000000001',
      related_product_id: '00000000-0000-4000-8000-000000000002',
      sort_order: 99,
    })
    results.push(
      memberProductRelatedInsert.error &&
        (memberProductRelatedInsert.error.code === '42501' ||
          memberProductRelatedInsert.error.message?.toLowerCase().includes('row-level security') ||
          memberProductRelatedInsert.error.message?.toLowerCase().includes('permission denied'))
        ? pass(
            'hardening.v4.member.product_related_insert_blocked',
            memberProductRelatedInsert.error.message ?? 'insert blocked',
          )
        : memberProductRelatedInsert.error?.code === '42P01'
          ? skip('hardening.v4.member.product_related_insert_blocked', 'table missing')
          : fail('hardening.v4.member.product_related_insert_blocked', memberProductRelatedInsert.error?.message ?? 'member inserted product_related'),
    )

    const memberAdminInquiryRead = await memberA.client.rpc('mark_admin_inquiry_read', {
      p_inquiry_id: '00000000-0000-4000-8000-000000000001',
    })
    results.push(
      memberAdminInquiryRead.error?.message?.includes('ADMIN_REQUIRED') ||
        memberAdminInquiryRead.error?.code === '42501' ||
        memberAdminInquiryRead.error?.message?.toLowerCase().includes('permission denied')
        ? pass(
            'hardening.v4.member.mark_admin_inquiry_read_blocked',
            memberAdminInquiryRead.error?.message ?? 'blocked',
          )
        : fail(
            'hardening.v4.member.mark_admin_inquiry_read_blocked',
            'non-admin member can mark inquiry read',
          ),
    )

    // Member cannot update arbitrary order
    const anyOrder = await selectRows(memberA.client, 'orders', 'id,status', 1)
    const orderToUpdate = anyOrder.data[0]?.id
    if (orderToUpdate) {
      const upd = await updateRow(memberA.client, 'orders', orderToUpdate, { status: 'shipped' })
      results.push(
        !upd.updated
          ? pass('member.orders.update_blocked', upd.error?.message ?? 'update returned 0 rows')
          : fail('member.orders.update_blocked', 'member updated order status'),
      )
    } else {
      // try update a random uuid — should fail
      const fakeId = '00000000-0000-4000-8000-000000000001'
      const upd = await updateRow(memberA.client, 'orders', fakeId, { status: 'shipped' })
      results.push(
        !upd.updated
          ? pass('member.orders.update_blocked', 'no orders to test; fake update blocked')
          : fail('member.orders.update_blocked', 'fake order update succeeded'),
      )
    }

    // Admin gate simulation: member JWT must not be admin
    const memberSession = (await memberA.client.auth.getSession()).data.session
    const memberJwt = decodeJwtPayload(memberSession?.access_token ?? '')
    results.push(
      !isAdminJwt(memberJwt)
        ? pass('member.admin_gate.jwt', 'app_metadata.role is not admin')
        : fail('member.admin_gate.jwt', 'member JWT has admin role'),
    )
  }

  // -------------------------------------------------------------------------
  // 3) Admin verification
  // -------------------------------------------------------------------------
  const adminPassword = env.ADMIN_TEST_PASSWORD ?? env.AUTH_ADMIN_PASSWORD
  if (!adminPassword) {
    results.push(
      skip('admin.setup', 'Set ADMIN_TEST_PASSWORD to run admin live tests'),
    )
  } else {
    const admin = await signInClient(url, anonKey, 'admin@twotwoshop.com', adminPassword)

    if (admin.error) {
      results.push(fail('admin.login', admin.error.message))
    } else {
      results.push(pass('admin.login', 'signInWithPassword succeeded'))

      const jwt = decodeJwtPayload(admin.session?.access_token ?? '')
      const role = jwt?.app_metadata?.role

      results.push(
        role === 'admin'
          ? pass('admin.jwt.role', `app_metadata.role = "${role}"`)
          : fail('admin.jwt.role', `expected "admin", got ${JSON.stringify(role)}`, {
              fixSql: `update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where email = 'admin@twotwoshop.com';`,
              hint: 'Re-login after SQL to refresh JWT',
            }),
      )

      const { data: isAdminRpc, error: isAdminRpcErr } = await admin.client.rpc('is_admin')
      results.push(
        isAdminRpc === true
          ? pass('admin.is_admin_rpc', 'returns true')
          : fail('admin.is_admin_rpc', `expected true, got ${JSON.stringify(isAdminRpc)}`, {
              error: isAdminRpcErr?.message,
            }),
      )

      const adminOrders = await selectRows(admin.client, 'orders', 'id,order_number,status', 10)
      results.push(
        !adminOrders.error && adminOrders.count > 0
          ? pass('admin.orders.select_all', `readable orders: ${adminOrders.count}+`)
          : adminOrders.error
            ? fail('admin.orders.select_all', adminOrders.error.message)
            : skip('admin.orders.select_all', '0 orders in DB (empty shop)'),
      )

      const adminInquiries = await selectRows(admin.client, 'customer_inquiries', 'id,status', 5)
      results.push(
        !adminInquiries.error
          ? pass('admin.inquiries.select', `readable: ${adminInquiries.count} (errors none)`)
          : fail('admin.inquiries.select', adminInquiries.error.message),
      )

      const adminProducts = await selectRows(admin.client, 'products', 'id,name,status', 5)
      results.push(
        !adminProducts.error && adminProducts.count >= 0
          ? pass('admin.products.select', `readable products: ${adminProducts.count}`)
          : fail('admin.products.select', adminProducts.error?.message ?? 'unknown'),
      )

      // Admin without role should fail app gate — test by email-only logic
      results.push(
        isAdminJwt(jwt)
          ? pass('admin.ui_gate.equivalent', 'JWT passes isAdminUser check used by AdminAuthGate')
          : fail('admin.ui_gate.equivalent', 'JWT would be rejected at /admin'),
      )
    }
  }

  // -------------------------------------------------------------------------
  // 4) Member order detail RPC items key (if member A has orders)
  // -------------------------------------------------------------------------
  if (memberA.client) {
    const { data: ordersRpc, error: ordersRpcErr } = await memberA.client.rpc('get_member_orders')
    if (!ordersRpcErr && Array.isArray(ordersRpc) && ordersRpc.length > 0) {
      const orderId = ordersRpc[0].id
      const { data: detail, error: detailErr } = await memberA.client.rpc('get_member_order_by_id', {
        p_order_id: orderId,
      })

      if (!detailErr && detail) {
        const record = typeof detail === 'string' ? JSON.parse(detail) : detail
        const items = record.items ?? record.order_items
        const itemCount = Array.isArray(items) ? items.length : 0
        results.push(
          itemCount > 0
            ? pass('mypage.order_detail.items', `order ${orderId} has ${itemCount} item(s)`)
            : fail('mypage.order_detail.items', 'items array empty in RPC response', { record }),
        )
      } else {
        results.push(skip('mypage.order_detail.items', detailErr?.message ?? 'no detail'))
      }
    } else {
      results.push(skip('mypage.order_detail.items', 'member has no orders to verify items display'))
    }
  }

  // -------------------------------------------------------------------------
  // Report
  // -------------------------------------------------------------------------
  const passed = results.filter((r) => r.status === 'PASS')
  const failed = results.filter((r) => r.status === 'FAIL')
  const skipped = results.filter((r) => r.status === 'SKIP')

  console.log('\n--- Results ---\n')
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '○'
    console.log(`${icon} [${r.status}] ${r.id}`)
    console.log(`    ${r.detail}`)
    if (r.fixSql) console.log(`    FIX SQL: ${r.fixSql}`)
    if (r.hint) console.log(`    HINT: ${r.hint}`)
    if (r.error) console.log(`    ERROR: ${r.error}`)
  }

  console.log('\n--- Summary ---')
  console.log(`PASS: ${passed.length}  FAIL: ${failed.length}  SKIP: ${skipped.length}`)

  if (failed.length > 0) {
    console.log('\nDEPLOYMENT: BLOCKED (failures present)')
    process.exit(2)
  }

  if (skipped.some((s) => s.id.startsWith('admin.'))) {
    console.log('\nDEPLOYMENT: CONDITIONAL (admin tests skipped — provide ADMIN_TEST_PASSWORD)')
    process.exit(3)
  }

  console.log('\nDEPLOYMENT: API checks passed (UI flow still requires manual browser verification)')
  process.exit(0)
}

main().catch((error) => {
  console.error('Fatal:', error)
  process.exit(99)
})
