import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import {
  createServiceClient,
  hashResetToken,
} from '../_shared/phoneVerification.ts'

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return optionsResponse()
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed.' }, 405)
  }

  try {
    const body = await request.json()
    const resetToken = String(body?.resetToken ?? '').trim()
    const newPassword = String(body?.newPassword ?? '')
    const confirmPassword = String(body?.confirmPassword ?? '')

    if (!resetToken) {
      return jsonResponse({ ok: false, message: '인증 정보가 만료되었습니다. 다시 시도해주세요.' }, 400)
    }

    if (!newPassword || !confirmPassword) {
      return jsonResponse({ ok: false, message: '새 비밀번호를 입력해주세요.' }, 400)
    }

    if (newPassword !== confirmPassword) {
      return jsonResponse({ ok: false, message: '비밀번호가 일치하지 않습니다.' }, 400)
    }

    if (!PASSWORD_PATTERN.test(newPassword)) {
      return jsonResponse(
        { ok: false, message: '비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다.' },
        400,
      )
    }

    const supabase = createServiceClient()
    const resetTokenHash = await hashResetToken(resetToken)

    const { data: verification, error } = await supabase
      .from('phone_verifications')
      .select('id, user_id, verified_at, used_at, reset_token_hash, reset_token_expires_at')
      .eq('reset_token_hash', resetTokenHash)
      .eq('purpose', 'password_reset')
      .maybeSingle()

    if (error || !verification) {
      return jsonResponse({ ok: false, message: '인증 정보가 만료되었습니다. 다시 시도해주세요.' }, 400)
    }

    if (!verification.verified_at || verification.used_at) {
      return jsonResponse({ ok: false, message: '인증 정보가 만료되었습니다. 다시 시도해주세요.' }, 400)
    }

    if (
      !verification.reset_token_expires_at ||
      new Date(verification.reset_token_expires_at).getTime() < Date.now()
    ) {
      return jsonResponse({ ok: false, message: '인증 정보가 만료되었습니다. 다시 시도해주세요.' }, 400)
    }

    const { error: updateUserError } = await supabase.auth.admin.updateUserById(
      verification.user_id,
      { password: newPassword },
    )

    if (updateUserError) {
      console.error('[phone-password-reset-complete] updateUser failed:', updateUserError.message)
      return jsonResponse({ ok: false, message: '비밀번호 변경에 실패했습니다.' }, 500)
    }

    const usedAt = new Date().toISOString()
    const { error: markUsedError } = await supabase
      .from('phone_verifications')
      .update({ used_at: usedAt })
      .eq('id', verification.id)

    if (markUsedError) {
      console.error('[phone-password-reset-complete] mark used failed:', markUsedError.message)
    }

    return jsonResponse({
      ok: true,
      message: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.',
    })
  } catch (error) {
    console.error('[phone-password-reset-complete]', error)
    return jsonResponse({ ok: false, message: '비밀번호 변경에 실패했습니다.' }, 500)
  }
})
