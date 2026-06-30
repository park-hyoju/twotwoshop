import type { Session } from '@supabase/supabase-js'
import {
  CUSTOMER_INVALID_CREDENTIALS_MESSAGE,
  CUSTOMER_RATE_LIMIT_MESSAGE,
  CUSTOMER_SIGNUP_BLOCKED_MESSAGE,
  CUSTOMER_SIGNUP_EMAIL_CONFIRMATION_MESSAGE,
  CUSTOMER_SIGNUP_SUCCESS_MESSAGE,
  extractUsernameFromAuthEmail,
  isAuthRateLimitError,
  isCustomerAuthEmail,
  mapCustomerAuthErrorMessage,
  normalizeLoginEmail,
} from '../lib/customerAuthConfig'
import {
  sanitizeMemberProfileInput,
  validateCustomerSignUpInput,
  validatePassword,
  validatePasswordConfirm,
  type CustomerSignUpInput,
} from '../lib/customerAuthValidation'
import { isAdminUser } from '../lib/adminAuthConfig'
import {
  getPasswordResetRedirectUrl,
  PASSWORD_RESET_INVALID_LINK_MESSAGE,
} from '../lib/passwordResetConfig'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { UserProfile } from '../types/userProfile'
import { issueWelcomeCoupon } from './couponRepository'
import {
  fetchCurrentUserProfile,
  resolveLoginEmail,
  upsertCustomerProfile,
} from './userProfileRepository'

export type CustomerAuthErrorCode = 'signup_rate_limit'

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

function throwSignupRateLimitError(cause: unknown): never {
  throw new CustomerAuthError(CUSTOMER_RATE_LIMIT_MESSAGE, cause, 'signup_rate_limit')
}

export function isSignupRateLimitError(error: unknown): boolean {
  return error instanceof CustomerAuthError && error.code === 'signup_rate_limit'
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
  name: string
  email: string
  phone?: string
} {
  const metadata = session.user.user_metadata
  const usernameFromMeta =
    metadata && typeof metadata.username === 'string' ? metadata.username.trim() : ''
  const displayNameFromMeta =
    metadata && typeof metadata.display_name === 'string'
      ? metadata.display_name.trim()
      : ''
  const phoneFromMeta =
    metadata && typeof metadata.phone === 'string' ? metadata.phone.replace(/\D/g, '') : ''

  const username = usernameFromMeta || extractUsernameFromAuthEmail(session.user.email) || 'member'
  const name = displayNameFromMeta || username
  const email = session.user.email ?? ''

  return {
    name,
    email,
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

async function createProfileForUser(
  userId: string,
  input: { name: string; email: string; phone: string },
): Promise<void> {
  if (import.meta.env.DEV) {
    console.log('[customerAuthService] creating profile for auth user:', userId)
  }

  const profile = await upsertCustomerProfile({
    name: input.name,
    email: input.email,
    phone: input.phone,
  })

  if (!profile) {
    throw new CustomerAuthError('회원 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
  }

  if (profile.id !== userId) {
    throw new CustomerAuthError('회원 정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
  }
}

export async function signUpCustomer(input: CustomerSignUpInput): Promise<CustomerSignUpResult> {
  assertSupabaseReady()

  const validationError = validateCustomerSignUpInput(input)
  if (validationError) {
    throw new CustomerAuthError(validationError)
  }

  const sanitized = sanitizeMemberProfileInput({
    name: input.name,
    phone: input.phone,
  })
  const authEmail = normalizeLoginEmail(input.email)
  const marketingConsent = Boolean(input.agreedMarketing)

  const { data, error } = await supabase!.auth.signUp({
    email: authEmail,
    password: input.password,
    options: {
      data: {
        display_name: sanitized.name,
        phone: sanitized.phone,
        marketing_consent: marketingConsent,
      },
    },
  })

  if (error) {
    console.error('[customerAuthService] signUp failed:', error.message)

    if (isAuthRateLimitError(error)) {
      throwSignupRateLimitError(error)
    }

    throw mapAuthError(error.message, 'signup', error)
  }

  if (!data.user) {
    throw new CustomerAuthError(CUSTOMER_SIGNUP_BLOCKED_MESSAGE)
  }

  if (!data.session) {
    return {
      successMessage: CUSTOMER_SIGNUP_EMAIL_CONFIRMATION_MESSAGE,
      requiresEmailConfirmation: true,
    }
  }

  const verifiedSession = await ensureCustomerSession(data.session)

  try {
    await createProfileForUser(verifiedSession.user.id, {
      name: sanitized.name,
      email: authEmail,
      phone: sanitized.phone,
    })
    await issueWelcomeCoupon()
  } finally {
    const { error: signOutError } = await supabase!.auth.signOut()
    if (signOutError && import.meta.env.DEV) {
      console.warn('[customerAuthService] post-signup signOut failed:', signOutError.message)
    }
  }

  return {
    successMessage: CUSTOMER_SIGNUP_SUCCESS_MESSAGE,
    requiresEmailConfirmation: false,
  }
}

export async function signInCustomer(email: string, password: string): Promise<Session> {
  assertSupabaseReady()

  const normalizedInput = normalizeLoginEmail(email)

  if (!normalizedInput) {
    throw new CustomerAuthError('이메일을 입력해주세요.')
  }

  if (!password) {
    throw new CustomerAuthError('비밀번호를 입력해주세요.')
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    throw new CustomerAuthError(passwordError)
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

export async function requestPasswordResetEmail(email: string): Promise<void> {
  assertSupabaseReady()

  const normalizedInput = normalizeLoginEmail(email)

  if (!normalizedInput) {
    throw new CustomerAuthError('이메일을 입력해주세요.')
  }

  const authEmail = await resolveLoginEmail(normalizedInput)

  const { error } = await supabase!.auth.resetPasswordForEmail(authEmail, {
    redirectTo: getPasswordResetRedirectUrl(),
  })

  if (error) {
    if (isAuthRateLimitError(error)) {
      throw new CustomerAuthError(CUSTOMER_RATE_LIMIT_MESSAGE, error)
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

  if (metadata && typeof metadata.display_name === 'string' && metadata.display_name.trim()) {
    return metadata.display_name.trim()
  }

  return null
}

export function getCustomerUsername(session: Session | null): string | null {
  const metadata = session?.user.user_metadata

  if (metadata && typeof metadata.username === 'string' && metadata.username.trim()) {
    return metadata.username.trim()
  }

  return extractUsernameFromAuthEmail(session?.user.email)
}
