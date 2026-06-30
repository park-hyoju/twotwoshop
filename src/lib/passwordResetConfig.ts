import { ROUTES } from './routes'

/** Shown after reset email is requested (same message regardless of account existence). */
export const PASSWORD_RESET_EMAIL_SENT_MESSAGE =
  '입력하신 이메일로 비밀번호 재설정 안내 메일을 보냈습니다. 메일함에서 비밀번호 재설정 링크를 확인해주세요.'

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.'

export const PASSWORD_RESET_INVALID_LINK_MESSAGE =
  '비밀번호 재설정 링크가 만료되었거나 올바르지 않습니다. 비밀번호 찾기를 다시 시도해주세요.'

export function getPasswordResetRedirectUrl(): string {
  if (typeof window === 'undefined' || !window.location?.origin) {
    throw new Error('getPasswordResetRedirectUrl must be called in the browser.')
  }

  return `${window.location.origin}${ROUTES.resetPassword}`
}
