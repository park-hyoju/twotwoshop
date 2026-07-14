import type { Session } from '@supabase/supabase-js'
import {
  CUSTOMER_INVALID_CREDENTIALS_MESSAGE,
  CUSTOMER_LOGIN_ID_TAKEN_MESSAGE,
  CUSTOMER_RATE_LIMIT_MESSAGE,
  CUSTOMER_SIGNUP_BLOCKED_MESSAGE,
  CUSTOMER_SIGNUP_SUCCESS_MESSAGE,
  extractUsernameFromAuthEmail,
  isAuthRateLimitError,
  isCustomerAuthEmail,
  isVirtualCustomerAuthEmail,
  mapCustomerAuthErrorMessage,
  normalizeLoginEmail,
} from '../lib/customerAuthConfig'
import {
  sanitizeMemberProfileInput,
  validateCustomerSignUpInput,
  validateLoginInput,
  validatePassword,
  validatePasswordConfirm,
  type CustomerSignUpInput,
} from '../lib/customerAuthValidation'
import { sanitizeEmail, sanitizeUsernameInput } from '../utils/sanitize'
import { isAdminUser } from '../lib/adminAuthConfig'
import {
  PASSWORD_RESET_INVALID_LINK_MESSAGE,
  getPasswordResetRedirectUrl,
} from '../lib/passwordResetConfig'
import { PASSWORD_RESET_RATE_LIMIT_MESSAGE } from '../lib/passwordResetCooldown'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { EDGE_FUNCTION_CUSTOMER_SIGNUP } from '../lib/supabaseEdgeFunctions'
import type { UserProfile } from '../types/userProfile'
import {
  fetchCurrentUserProfile,
  resolveLoginEmail,
  upsertCustomerProfile,
} from './userProfileRepository'

export type CustomerAuthErrorCode = 'signup_rate_limit' | 'password_reset_rate_limit'

export interface CustomerSignUpResult {
  successMessage: string
  requiresEmailConfirmation: boolean
}

export class CustomerAuthError extends Error {
  cause?: unknown
  code?: CustomerAuthErrorCode

  constructor(message: string, cause?: unknown, code?: CustomerAuthErrorCode) {
    super(message)
    this.name = 'CustomerAuthError'
    this.cause = cause
    this.code = code
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new CustomerAuthError(
      'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.',
    )
  }
}

function mapAuthError(
  message: string,
  context: 'signin' | 'signup',
  cause?: unknown,
): CustomerAuthError {
  if (cause instanceof TypeError && cause.message.toLowerCase().includes('fetch')) {
    return new CustomerAuthError(mapCustomerAuthErrorMessage('Failed to fetch', context), cause)
  }

  return new CustomerAuthError(mapCustomerAuthErrorMessage(message, context), cause)
}

export function isSignupRateLimitError(error: unknown): boolean {
  return error instanceof CustomerAuthError && error.code === 'signup_rate_limit'
}

export function isPasswordResetRateLimitError(error: unknown): boolean {
  return error instanceof CustomerAuthError && error.code === 'password_reset_rate_limit'
}

async function ensureCustomerSession(session: Session | null): Promise<Session> {
  if (!session?.user?.email) {
    throw new CustomerAuthError(CUSTOMER_INVALID_CREDENTIALS_MESSAGE)
  }

  if (isAdminUser(session.user)) {
    await supabase!.auth.signOut()
    throw new CustomerAuthError(CUSTOMER_INVALID_CREDENTIALS_MESSAGE)
  }

  if (!isCustomerAuthEmail(session.user.email)) {
    if (import.meta.env.DEV) {
      console.error('[customerAuthService] invalid customer session email:', session.user.email)
    }
    await supabase!.auth.signOut()
    throw new CustomerAuthError(CUSTOMER_INVALID_CREDENTIALS_MESSAGE)
  }

  return session
}

function buildProfileInputFromSession(session: Session): {
  loginId: string
  name: string
  email: string
  optionalEmail?: string | null
  phone?: string
} {
  const metadata = session.user.user_metadata
  const usernameFromMeta =
    (metadata && typeof metadata.login_id === 'string' ? metadata.login_id.trim() : '') ||
    (metadata && typeof metadata.username === 'string' ? metadata.username.trim() : '')
  const displayNameFromMeta =
    (metadata && typeof metadata.name === 'string' ? metadata.name.trim() : '') ||
    (metadata && typeof metadata.display_name === 'string' ? metadata.display_name.trim() : '')
  const phoneFromMeta =
    metadata && typeof metadata.phone === 'string' ? metadata.phone.replace(/\D/g, '') : ''
  const optionalEmailFromMeta =
    metadata && typeof metadata.optional_email === 'string'
      ? sanitizeEmail(metadata.optional_email)
      : null

  const loginId =
    usernameFromMeta || extractUsernameFromAuthEmail(session.user.email) || 'member'
  const name = displayNameFromMeta || loginId
  const email = session.user.email ?? ''

  return {
    loginId,
    name,
    email,
    optionalEmail: optionalEmailFromMeta,
    phone: phoneFromMeta || undefined,
  }
}

export async function syncCustomerProfileIfMissing(session: Session): Promise<UserProfile | null> {
  const existing = await fetchCurrentUserProfile(session.user.id)
  if (existing) {
    return existing
  }

  const profile = await upsertCustomerProfile(buildProfileInputFromSession(session))

  if (!profile && import.meta.env.DEV) {
    console.warn('[customerAuthService] profile sync failed for user:', session.user.id)
  }

  return profile
}

async function invokeCustomerSignupFunction(body: Record<string, unknown>): Promise<{
  ok: true
  userId: string
  message: string
}> {
  const { data, error } = await supabase!.functions.invoke(EDGE_FUNCTION_CUSTOMER_SIGNUP, { body })

  if (error) {
    let message = CUSTOMER_SIGNUP_BLOCKED_MESSAGE

    const context = (error as { context?: Response }).context
    if (context) {
      try {
        const payload = (await context.json()) as { message?: string }
        if (typeof payload.message === 'string') {
          message = payload.message
        }
      } catch {
        // ignore JSON parse errors
      }
    }

    throw new CustomerAuthError(message, error)
  }

  const payload = data as { ok?: boolean; message?: string; userId?: string }

  if (!payload || payload.ok !== true) {
    const message =
      payload && typeof payload.message === 'string'
        ? payload.message
        : CUSTOMER_SIGNUP_BLOCKED_MESSAGE

    if (message.includes('이미 사용 중인 아이디')) {
      throw new CustomerAuthError(CUSTOMER_LOGIN_ID_TAKEN_MESSAGE)
    }

    throw new CustomerAuthError(message)
  }

  return {
    ok: true,
    userId: payload.userId ?? '',
    message: payload.message ?? CUSTOMER_SIGNUP_SUCCESS_MESSAGE,
  }
}

export async function signUpCustomer(input: CustomerSignUpInput): Promise<CustomerSignUpResult> {
  assertSupabaseReady()

  const validationError = validateCustomerSignUpInput(input)
  if (validationError) {
    throw new CustomerAuthError(validationError)
  }

  const loginId = sanitizeUsernameInput(input.loginId)
  const sanitized = sanitizeMemberProfileInput({
    name: input.name,
    phone: input.phone,
  })

  const result = await invokeCustomerSignupFunction({
    loginId,
    password: input.password,
    passwordConfirm: input.passwordConfirm,
    name: sanitized.name,
    phone: sanitized.phone,
    optionalEmail: null,
    marketingConsent: Boolean(input.agreedMarketing),
    agreedTerms: input.agreedTerms,
    agreedPrivacy: input.agreedPrivacy,
  })

  return {
    successMessage: result.message || CUSTOMER_SIGNUP_SUCCESS_MESSAGE,
    requiresEmailConfirmation: false,
  }
}

export async function signInCustomer(loginId: string, password: string): Promise<Session> {
  assertSupabaseReady()

  const normalizedInput = normalizeLoginEmail(loginId)

  const validationError = validateLoginInput({
    loginId: normalizedInput,
    password,
  })
  if (validationError) {
    throw new CustomerAuthError(validationError)
  }

  const authEmail = await resolveLoginEmail(normalizedInput)

  if (import.meta.env.DEV) {
    console.log('[customerAuthService] signIn attempt:', {
      input: normalizedInput,
      authEmail,
    })
  }

  const { data, error } = await supabase!.auth.signInWithPassword({
    email: authEmail,
    password,
  })

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[customerAuthService] signIn failed:', error.message, {
        input: normalizedInput,
        authEmail,
      })
    }

    if (isAuthRateLimitError(error)) {
      throw new CustomerAuthError(CUSTOMER_RATE_LIMIT_MESSAGE, error)
    }

    throw mapAuthError(error.message, 'signin', error)
  }

  const verifiedSession = await ensureCustomerSession(data.session)
  await syncCustomerProfileIfMissing(verifiedSession)

  return verifiedSession
}

export async function requestPasswordResetEmail(identifier: string): Promise<void> {
  assertSupabaseReady()

  const normalizedInput = normalizeLoginEmail(identifier)

  if (!normalizedInput) {
    throw new CustomerAuthError('아이디 또는 이메일을 입력해주세요.')
  }

  const authEmail = await resolveLoginEmail(normalizedInput)

  if (!authEmail) {
    throw new CustomerAuthError('아이디 또는 이메일을 입력해주세요.')
  }

  if (isVirtualCustomerAuthEmail(authEmail)) {
    throw new CustomerAuthError(
      '비밀번호 재설정을 위해 가입 시 등록한 이메일(선택)이 필요합니다. 고객센터로 문의해주세요.',
    )
  }

  const { error } = await supabase!.auth.resetPasswordForEmail(authEmail, {
    redirectTo: getPasswordResetRedirectUrl(),
  })

  if (error) {
    if (isAuthRateLimitError(error)) {
      throw new CustomerAuthError(
        PASSWORD_RESET_RATE_LIMIT_MESSAGE,
        error,
        'password_reset_rate_limit',
      )
    }

    if (import.meta.env.DEV) {
      console.warn('[customerAuthService] resetPasswordForEmail:', error.message)
    }
  }
}

export async function completePasswordReset(
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  assertSupabaseReady()

  const passwordError = validatePassword(newPassword) ?? validatePasswordConfirm(newPassword, confirmPassword)
  if (passwordError) {
    throw new CustomerAuthError(passwordError)
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase!.auth.getSession()

  if (sessionError || !session) {
    throw new CustomerAuthError(PASSWORD_RESET_INVALID_LINK_MESSAGE, sessionError)
  }

  if (isAdminUser(session.user)) {
    await supabase!.auth.signOut()
    throw new CustomerAuthError(PASSWORD_RESET_INVALID_LINK_MESSAGE)
  }

  const { error } = await supabase!.auth.updateUser({ password: newPassword })

  if (error) {
    if (isAuthRateLimitError(error)) {
      throw new CustomerAuthError(CUSTOMER_RATE_LIMIT_MESSAGE, error)
    }

    throw mapAuthError(error.message, 'signin', error)
  }

  const { error: signOutError } = await supabase!.auth.signOut()

  if (signOutError && import.meta.env.DEV) {
    console.warn('[customerAuthService] post-reset signOut failed:', signOutError.message)
  }
}

export async function signOutCustomer(): Promise<void> {
  assertSupabaseReady()

  const { error } = await supabase!.auth.signOut()

  if (error) {
    throw new CustomerAuthError('로그아웃에 실패했습니다.', error)
  }
}

export function getCustomerDisplayName(session: Session | null): string | null {
  const metadata = session?.user.user_metadata

  if (metadata && typeof metadata.name === 'string' && metadata.name.trim()) {
    return metadata.name.trim()
  }

  if (metadata && typeof metadata.display_name === 'string' && metadata.display_name.trim()) {
    return metadata.display_name.trim()
  }

  return null
}

export function getCustomerUsername(session: Session | null): string | null {
  const metadata = session?.user.user_metadata

  if (metadata && typeof metadata.login_id === 'string' && metadata.login_id.trim()) {
    return metadata.login_id.trim()
  }

  if (metadata && typeof metadata.username === 'string' && metadata.username.trim()) {
    return metadata.username.trim()
  }

  return extractUsernameFromAuthEmail(session?.user.email)
}
