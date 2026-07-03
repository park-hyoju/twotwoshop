import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/phoneVerification.ts'

const AUTH_EMAIL_DOMAIN = 'twotwoshop.app'
const LOGIN_ID_PATTERN = /^[a-z0-9]{4,20}$/
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
const PHONE_PATTERN = /^01[0-9]{8,9}$/

function sanitizeLoginId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
}

function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

function sanitizeOptionalEmail(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim().toLowerCase()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return null
  }

  return trimmed
}

function sanitizeName(value: string): string {
  return value.trim().slice(0, 50)
}

async function issueWelcomeCouponForUser(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<void> {
  const { data: coupon } = await supabase
    .from('coupons')
    .select('id')
    .eq('code', 'WELCOME5000')
    .eq('is_active', true)
    .maybeSingle()

  if (!coupon?.id) {
    return
  }

  await supabase.from('member_coupons').upsert(
    {
      user_id: userId,
      coupon_id: coupon.id,
      expires_at: null,
    },
    { onConflict: 'user_id,coupon_id', ignoreDuplicates: true },
  )
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return optionsResponse()
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed.' }, 405)
  }

  try {
    const body = await request.json()
    const loginId = sanitizeLoginId(String(body?.loginId ?? ''))
    const password = String(body?.password ?? '')
    const passwordConfirm = String(body?.passwordConfirm ?? '')
    const name = sanitizeName(String(body?.name ?? ''))
    const phone = sanitizePhone(String(body?.phone ?? ''))
    const optionalEmail = sanitizeOptionalEmail(body?.optionalEmail)
    const marketingConsent = Boolean(body?.marketingConsent)
    const agreedTerms = Boolean(body?.agreedTerms)
    const agreedPrivacy = Boolean(body?.agreedPrivacy)

    if (!LOGIN_ID_PATTERN.test(loginId)) {
      return jsonResponse(
        { ok: false, message: '아이디는 4~20자의 영문 소문자와 숫자만 사용할 수 있습니다.' },
        400,
      )
    }

    if (!PASSWORD_PATTERN.test(password)) {
      return jsonResponse(
        { ok: false, message: '비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다.' },
        400,
      )
    }

    if (password !== passwordConfirm) {
      return jsonResponse({ ok: false, message: '비밀번호가 일치하지 않습니다.' }, 400)
    }

    if (!name) {
      return jsonResponse({ ok: false, message: '이름을 입력해주세요.' }, 400)
    }

    if (!PHONE_PATTERN.test(phone)) {
      return jsonResponse({ ok: false, message: '올바른 전화번호를 입력해주세요.' }, 400)
    }

    if (body?.optionalEmail && !optionalEmail) {
      return jsonResponse({ ok: false, message: '올바른 이메일 형식을 입력해주세요.' }, 400)
    }

    if (!agreedTerms) {
      return jsonResponse({ ok: false, message: '이용약관에 동의해주세요.' }, 400)
    }

    if (!agreedPrivacy) {
      return jsonResponse({ ok: false, message: '개인정보처리방침에 동의해주세요.' }, 400)
    }

    const supabase = createServiceClient()

    const { data: loginIdAvailable, error: availabilityError } = await supabase.rpc(
      'is_login_id_available',
      { p_login_id: loginId },
    )

    if (availabilityError) {
      console.error('[customer-signup] availability check failed:', availabilityError.message)
      return jsonResponse({ ok: false, message: '회원가입을 완료할 수 없습니다.' }, 500)
    }

    if (loginIdAvailable !== true) {
      return jsonResponse({ ok: false, message: '이미 사용 중인 아이디입니다.' }, 409)
    }

    const authEmail = `${loginId}@${AUTH_EMAIL_DOMAIN}`

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: {
        login_id: loginId,
        username: loginId,
        name,
        display_name: name,
        phone,
        optional_email: optionalEmail,
        marketing_consent: marketingConsent,
      },
    })

    if (createUserError || !createdUser.user) {
      const message = (createUserError?.message ?? '').toLowerCase()

      if (
        message.includes('already registered') ||
        message.includes('already exists') ||
        message.includes('duplicate')
      ) {
        return jsonResponse({ ok: false, message: '이미 사용 중인 아이디입니다.' }, 409)
      }

      console.error('[customer-signup] createUser failed:', createUserError?.message)
      return jsonResponse({ ok: false, message: '회원가입을 완료할 수 없습니다.' }, 500)
    }

    const userId = createdUser.user.id

    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: userId,
      login_id: loginId,
      name,
      phone,
      email: authEmail,
      optional_email: optionalEmail,
    })

    if (profileError) {
      console.error('[customer-signup] profile insert failed:', profileError.message)
      await supabase.auth.admin.deleteUser(userId)
      return jsonResponse({ ok: false, message: '회원 정보를 저장하지 못했습니다.' }, 500)
    }

    try {
      await issueWelcomeCouponForUser(supabase, userId)
    } catch (couponError) {
      console.warn('[customer-signup] welcome coupon issue failed:', couponError)
    }

    return jsonResponse({
      ok: true,
      userId,
      message: '가입이 완료되었습니다. 로그인해주세요.',
    })
  } catch (error) {
    console.error('[customer-signup]', error)
    return jsonResponse({ ok: false, message: '회원가입을 완료할 수 없습니다.' }, 500)
  }
})
