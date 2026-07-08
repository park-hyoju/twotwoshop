import type { User } from '@supabase/supabase-js'

export const ADMIN_LOGIN_ID = 'admintwotwo'
export const ADMIN_EMAIL_DOMAIN = 'twotwoshop.com'
export const ADMIN_DEFAULT_EMAIL = `${ADMIN_LOGIN_ID}@${ADMIN_EMAIL_DOMAIN}`
export const ADMIN_ROLE = 'admin'

/** Legacy admin email — still accepted at login for migration period. */
export const ADMIN_LEGACY_EMAIL = 'admin@twotwoshop.com'

/** @deprecated Use ADMIN_DEFAULT_EMAIL */
export const ADMIN_ALLOWED_EMAIL = ADMIN_LEGACY_EMAIL

export const ADMIN_UNAUTHORIZED_MESSAGE = '관리자 권한이 없습니다.'

export const ADMIN_INVALID_CREDENTIALS_MESSAGE =
  '아이디 또는 비밀번호가 올바르지 않습니다.'

/**
 * Resolves admin login input to Supabase Auth email.
 * - Contains @ → use as email (trim + lowercase)
 * - Otherwise → `{loginId}@twotwoshop.com`
 * - Legacy alias `admin` → admin@twotwoshop.com
 */
export function resolveAdminLoginId(loginId: string): string {
  const trimmed = loginId.trim()
  const normalized = trimmed.toLowerCase()

  if (!normalized) {
    return ''
  }

  if (normalized.includes('@')) {
    return normalized
  }

  if (normalized === 'admin') {
    return ADMIN_LEGACY_EMAIL
  }

  return `${normalized}@${ADMIN_EMAIL_DOMAIN}`
}

export function isAdminAuthEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }

  return email.trim().toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`)
}

export function isAdminUser(
  user:
    | Pick<User, 'app_metadata' | 'email'>
    | { app_metadata?: Record<string, unknown>; email?: string | null }
    | null
    | undefined,
): boolean {
  if (!user) {
    return false
  }

  if (user.app_metadata && typeof user.app_metadata === 'object') {
    if (user.app_metadata.role === ADMIN_ROLE) {
      return true
    }
  }

  return false
}
