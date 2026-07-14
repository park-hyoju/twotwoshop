import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/phoneVerification.ts'

const MEMBER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone ?? '').replace(/\D/g, '')
}

async function assertCallerIsAdmin(
  authHeader: string,
): Promise<{ userId: string; callerClient: ReturnType<typeof createClient> } | Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !anonKey) {
    console.error('[admin-delete-member] missing supabase env')
    return jsonResponse({ ok: false, message: '서버 설정 오류입니다.' }, 500)
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await callerClient.auth.getUser()
  if (userError || !userData.user) {
    return jsonResponse({ ok: false, message: '인증이 필요합니다.' }, 401)
  }

  const { data: isAdmin, error: adminError } = await callerClient.rpc('is_admin')
  if (adminError || isAdmin !== true) {
    return jsonResponse({ ok: false, message: '관리자 권한이 필요합니다.' }, 403)
  }

  return { userId: userData.user.id, callerClient }
}

async function targetHasOrders(
  service: ReturnType<typeof createServiceClient>,
  callerClient: ReturnType<typeof createClient>,
  memberId: string,
  phone: string | null,
): Promise<boolean> {
  const { data: byUserId, error: byUserError } = await service
    .from('orders')
    .select('id')
    .eq('user_id', memberId)
    .limit(1)

  if (byUserError) {
    throw byUserError
  }

  if (byUserId && byUserId.length > 0) {
    return true
  }

  const phoneDigits = normalizePhoneDigits(phone)
  if (phoneDigits) {
    const { data: phoneRows, error: phoneError } = await service
      .from('orders')
      .select('id, customer_phone')
      .not('customer_phone', 'is', null)

    if (phoneError) {
      throw phoneError
    }

    if (
      (phoneRows ?? []).some(
        (row) => normalizePhoneDigits(String(row.customer_phone ?? '')) === phoneDigits,
      )
    ) {
      return true
    }
  }

  // Same EXISTS rules as admin_list_members (user_id + normalized phone). Do not trust client has_order.
  const { data: list, error: listError } = await callerClient.rpc('admin_list_members')
  if (listError) {
    throw listError
  }

  const row = ((list ?? []) as Array<{ id: string; has_order?: boolean }>).find(
    (item) => item.id === memberId,
  )

  return Boolean(row?.has_order)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return optionsResponse()
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed.' }, 405)
  }

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ ok: false, message: '인증이 필요합니다.' }, 401)
    }

    const caller = await assertCallerIsAdmin(authHeader)
    if (caller instanceof Response) {
      return caller
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ ok: false, message: '요청 형식이 올바르지 않습니다.' }, 400)
    }

    const memberId =
      typeof body === 'object' &&
      body !== null &&
      typeof (body as { memberId?: unknown }).memberId === 'string'
        ? (body as { memberId: string }).memberId.trim()
        : ''

    if (!MEMBER_ID_PATTERN.test(memberId)) {
      return jsonResponse({ ok: false, message: '회원 정보가 올바르지 않습니다.' }, 400)
    }

    if (memberId === caller.userId) {
      return jsonResponse(
        { ok: false, message: '현재 로그인한 계정은 삭제할 수 없습니다.' },
        403,
      )
    }

    const service = createServiceClient()

    const { data: targetAuth, error: targetAuthError } = await service.auth.admin.getUserById(
      memberId,
    )

    if (targetAuthError || !targetAuth.user) {
      return jsonResponse({ ok: false, message: '회원을 찾을 수 없습니다.' }, 404)
    }

    if (targetAuth.user.app_metadata?.role === 'admin') {
      return jsonResponse({ ok: false, message: '관리자 계정은 삭제할 수 없습니다.' }, 403)
    }

    const { data: profile, error: profileError } = await service
      .from('user_profiles')
      .select('role, phone')
      .eq('id', memberId)
      .maybeSingle()

    if (profileError) {
      console.error('[admin-delete-member] profile lookup failed')
      return jsonResponse({ ok: false, message: '회원 정보를 확인하지 못했습니다.' }, 500)
    }

    if (profile?.role === 'admin') {
      return jsonResponse({ ok: false, message: '관리자 계정은 삭제할 수 없습니다.' }, 403)
    }

    let hasOrder = false
    try {
      hasOrder = await targetHasOrders(
        service,
        caller.callerClient,
        memberId,
        profile?.phone ?? null,
      )
    } catch {
      console.error('[admin-delete-member] order lookup failed')
      return jsonResponse({ ok: false, message: '주문 이력을 확인하지 못했습니다.' }, 500)
    }

    if (hasOrder) {
      return jsonResponse(
        { ok: false, message: '주문 이력이 있는 회원은 삭제할 수 없습니다.' },
        409,
      )
    }

    // user_profiles.id → auth.users ON DELETE CASCADE: auth delete removes profile.
    const { error: deleteError } = await service.auth.admin.deleteUser(memberId)

    if (deleteError) {
      console.error('[admin-delete-member] deleteUser failed')
      return jsonResponse({ ok: false, message: '회원 삭제에 실패했습니다.' }, 500)
    }

    return jsonResponse({ ok: true, message: '회원이 삭제되었습니다.' })
  } catch {
    console.error('[admin-delete-member] unexpected error')
    return jsonResponse({ ok: false, message: '회원 삭제에 실패했습니다.' }, 500)
  }
})
