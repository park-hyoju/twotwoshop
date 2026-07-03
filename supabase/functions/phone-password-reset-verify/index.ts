import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import {
  MAX_VERIFY_ATTEMPTS,
  RESET_TOKEN_EXPIRY_MINUTES,
  createServiceClient,
  hashResetToken,
  hashVerificationCode,
} from '../_shared/phoneVerification.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return optionsResponse()
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed.' }, 405)
  }

  try {
    const body = await request.json()
    const verificationId = String(body?.verificationId ?? '').trim()
    const code = String(body?.code ?? '').trim()

    if (!verificationId) {
      return jsonResponse({ ok: false, message: '인증 요청 정보가 없습니다.' }, 400)
    }

    if (!/^\d{6}$/.test(code)) {
      return jsonResponse({ ok: false, message: '6자리 인증번호를 입력해주세요.' }, 400)
    }

    const supabase = createServiceClient()
    const { data: verification, error } = await supabase
      .from('phone_verifications')
      .select(
        'id, user_id, code_hash, attempt_count, blocked_at, expires_at, verified_at, used_at',
      )
      .eq('id', verificationId)
      .eq('purpose', 'password_reset')
      .maybeSingle()

    if (error || !verification) {
      return jsonResponse({ ok: false, message: '인증 요청을 찾을 수 없습니다.' }, 404)
    }

    if (verification.used_at) {
      return jsonResponse({ ok: false, message: '이미 사용된 인증번호입니다.' }, 400)
    }

    if (verification.verified_at) {
      return jsonResponse({ ok: false, message: '이미 인증이 완료되었습니다.' }, 400)
    }

    if (verification.blocked_at || verification.attempt_count >= MAX_VERIFY_ATTEMPTS) {
      return jsonResponse(
        {
          ok: false,
          code: 'VERIFY_BLOCKED',
          message: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.',
        },
        403,
      )
    }

    if (new Date(verification.expires_at).getTime() < Date.now()) {
      return jsonResponse({ ok: false, message: '인증번호가 만료되었습니다. 다시 요청해주세요.' }, 400)
    }

    const expectedHash = await hashVerificationCode(verification.id, code)
    if (expectedHash !== verification.code_hash) {
      const nextAttemptCount = verification.attempt_count + 1
      const blockedAt =
        nextAttemptCount >= MAX_VERIFY_ATTEMPTS ? new Date().toISOString() : null

      await supabase
        .from('phone_verifications')
        .update({
          attempt_count: nextAttemptCount,
          blocked_at: blockedAt,
        })
        .eq('id', verification.id)

      if (blockedAt) {
        return jsonResponse(
          {
            ok: false,
            code: 'VERIFY_BLOCKED',
            message: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.',
          },
          403,
        )
      }

      const remaining = MAX_VERIFY_ATTEMPTS - nextAttemptCount
      return jsonResponse(
        {
          ok: false,
          message: `인증번호가 올바르지 않습니다. (${remaining}회 남음)`,
        },
        400,
      )
    }

    const resetToken = crypto.randomUUID()
    const resetTokenHash = await hashResetToken(resetToken)
    const resetTokenExpiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
    ).toISOString()
    const verifiedAt = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('phone_verifications')
      .update({
        verified_at: verifiedAt,
        reset_token_hash: resetTokenHash,
        reset_token_expires_at: resetTokenExpiresAt,
      })
      .eq('id', verification.id)

    if (updateError) {
      console.error('[phone-password-reset-verify] update failed:', updateError.message)
      return jsonResponse({ ok: false, message: '인증 처리에 실패했습니다.' }, 500)
    }

    return jsonResponse({
      ok: true,
      resetToken,
      resetTokenExpiresAt,
      message: '인증이 완료되었습니다.',
    })
  } catch (error) {
    console.error('[phone-password-reset-verify]', error)
    return jsonResponse({ ok: false, message: '인증 처리에 실패했습니다.' }, 500)
  }
})
