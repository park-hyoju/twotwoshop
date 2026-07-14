import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import {
  CODE_EXPIRY_MINUTES,
  createServiceClient,
  generateVerificationCode,
  getLatestSendCooldown,
  hashVerificationCode,
  invalidatePendingVerifications,
  lookupMember,
  maskPhone,
  normalizeIdentifier,
} from '../_shared/phoneVerification.ts'
import { sendVerificationSms } from '../_shared/solapi.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return optionsResponse()
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed.' }, 405)
  }

  try {
    const body = await request.json()
    const identifier = normalizeIdentifier(String(body?.identifier ?? ''))

    if (!identifier) {
      return jsonResponse({ ok: false, message: '아이디 또는 전화번호를 입력해주세요.' }, 400)
    }

    const supabase = createServiceClient()
    const member = await lookupMember(supabase, identifier)

    if (!member) {
      return jsonResponse({ ok: false, message: '일치하는 회원 정보를 찾을 수 없습니다.' }, 404)
    }

    const cooldownSeconds = await getLatestSendCooldown(supabase, member.user_id)
    if (cooldownSeconds > 0) {
      return jsonResponse(
        {
          ok: false,
          code: 'RESEND_COOLDOWN',
          message: `${cooldownSeconds}초 후에 다시 요청할 수 있습니다.`,
          cooldownSeconds,
        },
        429,
      )
    }

    await invalidatePendingVerifications(supabase, member.user_id)

    const code = generateVerificationCode()
    const verificationId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString()
    const codeHash = await hashVerificationCode(verificationId, code)

    const { error: insertError } = await supabase.from('phone_verifications').insert({
      id: verificationId,
      user_id: member.user_id,
      phone: member.phone_digits,
      purpose: 'password_reset',
      code_hash: codeHash,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error('[phone-password-reset-send] insert failed:', insertError.message)
      return jsonResponse({ ok: false, message: '인증번호 발송에 실패했습니다.' }, 500)
    }

    await sendVerificationSms({
      phoneDigits: member.phone_digits,
      code,
    })

    return jsonResponse({
      ok: true,
      verificationId,
      maskedPhone: maskPhone(member.phone_digits),
      expiresAt,
      message: '인증번호를 발송했습니다.',
    })
  } catch (error) {
    console.error('[phone-password-reset-send]', error)
    return jsonResponse({ ok: false, message: '인증번호 발송에 실패했습니다.' }, 500)
  }
})
