import { isAdminUser } from '../lib/adminAuthConfig'
import {
  createAuthEmail,
  extractUsernameFromAuthEmail,
  isCustomerAuthEmail,
  isVirtualCustomerAuthEmail,
  normalizeLoginEmail,
} from '../lib/customerAuthConfig'
import { normalizeUsername, sanitizeUsernameInput } from '../lib/customerAuthValidation'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { UserProfile } from '../types/userProfile'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function isStorefrontMember(
  user:
    | { email?: string | null; app_metadata?: Record<string, unknown> }
    | string
    | null
    | undefined,
): boolean {
  if (!user) {
    return false
  }

  if (typeof user === 'string') {
    return isCustomerAuthEmail(user)
  }

  if (!user.email || isAdminUser(user)) {
    return false
  }

  return isCustomerAuthEmail(user.email)
}

interface UserProfileRow {
  id: string
  login_id: string | null
  name: string | null
  phone: string | null
  email: string | null
  optional_email: string | null
  created_at: string
  updated_at: string
}

function mapUserProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    loginId: row.login_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    optionalEmail: row.optional_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const PROFILE_SELECT =
  'id, login_id, name, phone, email, optional_email, created_at, updated_at'

export async function fetchCurrentUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[userProfileRepository] profile fetch failed:', error.message)
    return null
  }

  return data ? mapUserProfileRow(data as UserProfileRow) : null
}

export async function isLoginIdAvailable(loginId: string): Promise<boolean> {
  const normalized = sanitizeUsernameInput(loginId)

  if (!normalized) {
    return false
  }

  if (!isSupabaseConfigured || !supabase) {
    return true
  }

  const { data, error } = await supabase.rpc('is_login_id_available', {
    p_login_id: normalized,
  })

  if (error) {
    console.warn('[userProfileRepository] is_login_id_available failed:', error.message)
    return true
  }

  return data === true
}

export async function upsertCustomerProfile(input: {
  loginId: string
  name: string
  email: string
  optionalEmail?: string | null
  phone?: string
}): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.warn('[userProfileRepository] auth.getUser failed:', userError.message)
    return null
  }

  const user = userData.user
  if (!user) {
    console.warn('[userProfileRepository] profile upsert skipped: no authenticated user')
    return null
  }

  const payload: {
    id: string
    login_id: string
    name: string
    email: string
    optional_email?: string | null
    phone?: string
  } = {
    id: user.id,
    login_id: sanitizeUsernameInput(input.loginId),
    name: input.name.trim(),
    email: input.email.trim(),
  }

  if (input.optionalEmail) {
    payload.optional_email = input.optionalEmail.trim()
  } else if (input.optionalEmail === null) {
    payload.optional_email = null
  }

  if (input.phone) {
    payload.phone = input.phone
  }

  if (import.meta.env.DEV) {
    console.log('[userProfileRepository] profile upsert auth check', {
      authUserId: user.id,
      payloadId: payload.id,
      idsMatch: user.id === payload.id,
    })
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(payload, { onConflict: 'id' })
    .select(PROFILE_SELECT)
    .single()

  if (error) {
    console.warn('[userProfileRepository] profile upsert failed:', error.message)
    if (import.meta.env.DEV) {
      console.warn('[userProfileRepository] profile upsert payload:', payload)
    }
    return null
  }

  return mapUserProfileRow(data as UserProfileRow)
}

/**
 * Resolves the Supabase Auth email for sign-in.
 * - Contains @ → use as email (trim + lowercase)
 * - Otherwise → RPC lookup by login id, then loginId@twotwoshop.app
 */
export async function resolveLoginEmail(identifier: string): Promise<string> {
  const normalized = normalizeLoginEmail(identifier)

  if (!normalized) {
    return ''
  }

  if (normalized.includes('@')) {
    return normalized
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('resolve_customer_login_email', {
      p_identifier: normalized,
    })

    if (error) {
      console.warn('[userProfileRepository] resolve_customer_login_email failed:', error.message)
    } else if (typeof data === 'string' && data.trim()) {
      return normalizeLoginEmail(data)
    }
  }

  return createAuthEmail(normalizeUsername(normalized))
}

/**
 * Resolves the email address that can receive a password reset link.
 * Virtual auth emails cannot receive mail; uses optional_email when available.
 */
export async function resolvePasswordResetDeliveryEmail(identifier: string): Promise<string> {
  const normalized = normalizeLoginEmail(identifier)

  if (!normalized) {
    return ''
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('resolve_customer_password_reset_email', {
      p_identifier: normalized,
    })

    if (error) {
      console.warn(
        '[userProfileRepository] resolve_customer_password_reset_email failed:',
        error.message,
      )
    } else if (typeof data === 'string' && data.trim()) {
      return normalizeLoginEmail(data)
    }
  }

  const authEmail = await resolveLoginEmail(normalized)

  if (!authEmail || isVirtualCustomerAuthEmail(authEmail)) {
    return ''
  }

  return authEmail
}

export function getUsernameFromProfileEmail(email: string | null | undefined): string | null {
  return extractUsernameFromAuthEmail(email)
}

export async function resolveProductUuid(productId: string, slug: string): Promise<string | null> {
  if (isUuid(productId)) {
    return productId
  }

  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data.id as string
}
