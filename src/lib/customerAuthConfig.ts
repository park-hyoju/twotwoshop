import { normalizeUsername } from './customerAuthValidation'

export const CUSTOMER_AUTH_EMAIL_DOMAIN = 'example.com'

export const CUSTOMER_INVALID_CREDENTIALS_MESSAGE =
  '이메일 또는 비밀번호가 올바르지 않습니다.'

export const CUSTOMER_INVALID_USERNAME_FORMAT_MESSAGE = '아이디 형식이 올바르지 않습니다.'

export const CUSTOMER_SIGNUP_BLOCKED_MESSAGE =
  '지금은 회원가입을 완료할 수 없습니다. 잠시 후 다시 시도해주세요.'

export const CUSTOMER_EMAIL_ALREADY_REGISTERED_MESSAGE =
  '이미 가입된 이메일입니다. 로그인해주세요.'

/** @deprecated Use CUSTOMER_EMAIL_ALREADY_REGISTERED_MESSAGE */
export const CUSTOMER_USERNAME_TAKEN_MESSAGE = CUSTOMER_EMAIL_ALREADY_REGISTERED_MESSAGE

export const CUSTOMER_SIGNUP_SUCCESS_MESSAGE = '가입이 완료되었습니다. 로그인해주세요.'

export const CUSTOMER_SIGNUP_EMAIL_CONFIRMATION_MESSAGE =
  '가입이 완료되었습니다. 이메일로 발송된 인증 링크를 확인한 후 로그인해주세요.'

export const CUSTOMER_RATE_LIMIT_MESSAGE =
  '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'

export const CUSTOMER_EMAIL_NOT_CONFIRMED_MESSAGE =
  '이메일 인증이 완료되지 않았습니다. 인증 메일을 확인하거나, Confirm email OFF 이전에 가입한 계정이라면 Supabase Dashboard에서 사용자를 확인 처리한 뒤 다시 로그인해주세요.'

export const CUSTOMER_NETWORK_ERROR_MESSAGE =
  '네트워크 오류가 발생했습니다. 다시 시도해주세요.'

/** @deprecated Dev-only hint; UI uses CUSTOMER_RATE_LIMIT_MESSAGE */
export const CUSTOMER_DEV_SIGNUP_RATE_LIMIT_MESSAGE =
  '회원가입 테스트 제한에 걸렸습니다. Supabase Dashboard에서 테스트 계정을 직접 생성한 뒤 로그인 테스트를 진행하세요.'

export const CUSTOMER_SIGNUP_RATE_LIMIT_COOLDOWN_SECONDS = 60

export function createAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${CUSTOMER_AUTH_EMAIL_DOMAIN}`
}

/** Login identifier: trim + lowercase (preserves @, ., _, -). */
export function normalizeLoginEmail(value: string): string {
  return value.trim().toLowerCase()
}

/** @deprecated Use createAuthEmail instead. */
export const resolveCustomerAuthEmail = createAuthEmail

/** Virtual-email signup users (@example.com). */
export function isVirtualCustomerAuthEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }

  return email.trim().toLowerCase().endsWith(`@${CUSTOMER_AUTH_EMAIL_DOMAIN}`)
}

/** Any valid non-admin auth email is treated as a storefront customer session. */
export function isCustomerAuthEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }

  const normalized = normalizeLoginEmail(email)
  return normalized.includes('@') && normalized.includes('.')
}

export function extractUsernameFromAuthEmail(email: string | null | undefined): string | null {
  if (!email) {
    return null
  }

  const normalized = normalizeLoginEmail(email)
  const atIndex = normalized.indexOf('@')
  if (atIndex <= 0) {
    return null
  }

  return normalized.slice(0, atIndex)
}

export function isAuthRateLimitMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('for security purposes') ||
    normalized.includes('only request this after')
  )
}

export function parseRateLimitCooldownSeconds(message: string): number | null {
  const match = message.match(/after\s+(\d+)\s+seconds?/i)
  if (!match) {
    return null
  }

  const seconds = Number.parseInt(match[1] ?? '', 10)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null
}

export function isEmailNotConfirmedMessage(message: string): boolean {
  return message.toLowerCase().includes('email not confirmed')
}

export function isAuthRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  if ('status' in error && (error as { status: number }).status === 429) {
    return true
  }

  if ('message' in error && typeof (error as { message: string }).message === 'string') {
    return isAuthRateLimitMessage((error as { message: string }).message)
  }

  return false
}

export function isAuthNetworkErrorMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('failed to fetch') ||
    normalized.includes('network error') ||
    normalized.includes('network request failed')
  )
}

export function mapCustomerAuthErrorMessage(
  message: string,
  context: 'signin' | 'signup' = 'signin',
): string {
  const normalized = message.toLowerCase()

  if (isAuthNetworkErrorMessage(message)) {
    return CUSTOMER_NETWORK_ERROR_MESSAGE
  }

  if (isAuthRateLimitMessage(message)) {
    if (context === 'signup' && import.meta.env.DEV) {
      console.error('[customerAuth] signup rate limit — use Dashboard test account for login:', message)
    }
    return CUSTOMER_RATE_LIMIT_MESSAGE
  }

  if (normalized.includes('invalid login credentials')) {
    return CUSTOMER_INVALID_CREDENTIALS_MESSAGE
  }

  if (context === 'signin' && normalized.includes('invalid email')) {
    return CUSTOMER_INVALID_CREDENTIALS_MESSAGE
  }

  if (
    normalized.includes('invalid email') ||
    (normalized.includes('email') && normalized.includes('is invalid'))
  ) {
    return CUSTOMER_INVALID_USERNAME_FORMAT_MESSAGE
  }

  if (normalized.includes('email not confirmed')) {
    if (context === 'signup') {
      return CUSTOMER_SIGNUP_EMAIL_CONFIRMATION_MESSAGE
    }
    return CUSTOMER_EMAIL_NOT_CONFIRMED_MESSAGE
  }

  if (
    normalized.includes('user already registered') ||
    normalized.includes('already been registered') ||
    normalized.includes('already exists')
  ) {
    return CUSTOMER_EMAIL_ALREADY_REGISTERED_MESSAGE
  }

  if (
    context === 'signup' &&
    (normalized.includes('password') ||
      normalized.includes('weak') ||
      normalized.includes('at least'))
  ) {
    return '비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다.'
  }

  if (context === 'signin') {
    return CUSTOMER_INVALID_CREDENTIALS_MESSAGE
  }

  return CUSTOMER_SIGNUP_BLOCKED_MESSAGE
}
