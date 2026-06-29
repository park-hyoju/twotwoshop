import type { User } from '@supabase/supabase-js'

export const ADMIN_ALLOWED_EMAIL = 'admin@twotwoshop.com'
export const ADMIN_ROLE = 'admin'

export const ADMIN_UNAUTHORIZED_MESSAGE = '관리자 권한이 없습니다.'

export const ADMIN_INVALID_CREDENTIALS_MESSAGE =
  '아이디 또는 비밀번호가 올바르지 않습니다.'

export function resolveAdminLoginId(loginId: string): string {
  const trimmed = loginId.trim()

  if (trimmed.toLowerCase() === 'admin') {
    return ADMIN_ALLOWED_EMAIL
  }

  return trimmed
}

export function isAdminUser(
  user: Pick<User, 'app_metadata'> | { app_metadata?: Record<string, unknown> } | null | undefined,
): boolean {
  if (!user?.app_metadata || typeof user.app_metadata !== 'object') {
    return false
  }

  return user.app_metadata.role === ADMIN_ROLE
}
