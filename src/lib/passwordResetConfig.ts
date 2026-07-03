/** Shown after SMS verification code is sent. */
export const PASSWORD_RESET_SMS_SENT_MESSAGE =
  '등록된 휴대폰 번호로 인증번호를 발송했습니다. 3분 내에 입력해주세요.'

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.'

export const PASSWORD_RESET_INVALID_LINK_MESSAGE =
  '비밀번호 재설정 링크가 만료되었거나 올바르지 않습니다. 비밀번호 찾기를 다시 시도해주세요.'

export const PASSWORD_RESET_VERIFY_BLOCKED_MESSAGE =
  '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.'

export function maskPhoneForDisplay(phoneDigits: string): string {
  const digits = phoneDigits.replace(/\D/g, '')
  if (digits.length < 7) {
    return digits
  }

  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
}

export function formatVerificationExpiryLabel(expiresAt: string): string {
  const remainingMs = new Date(expiresAt).getTime() - Date.now()
  if (remainingMs <= 0) {
    return '인증번호가 만료되었습니다.'
  }

  const remainingMinutes = Math.floor(remainingMs / 60_000)
  const remainingSeconds = Math.ceil((remainingMs % 60_000) / 1000)

  if (remainingMinutes > 0) {
    return `남은 시간 ${remainingMinutes}분 ${remainingSeconds}초`
  }

  return `남은 시간 ${remainingSeconds}초`
}

/** @deprecated Email reset redirect — legacy /reset-password route only */
export function getPasswordResetRedirectUrl(): string {
  if (typeof window === 'undefined' || !window.location?.origin) {
    throw new Error('getPasswordResetRedirectUrl must be called in the browser.')
  }

  return `${window.location.origin}/reset-password`
}
