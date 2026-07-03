import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export const CODE_EXPIRY_MINUTES = 3
export const MAX_VERIFY_ATTEMPTS = 5
export const RESET_TOKEN_EXPIRY_MINUTES = 10
export const RESEND_COOLDOWN_SECONDS = 60

export interface MemberLookupRow {
  user_id: string
  phone_digits: string
}

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service credentials are not configured.')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function getVerificationSecret(): string {
  return (
    Deno.env.get('PHONE_VERIFICATION_SECRET') ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    'dev-phone-verification-secret'
  )
}

export function normalizeIdentifier(value: string): string {
  return value.trim()
}

export function isPhoneIdentifier(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return /^01[0-9]{8,9}$/.test(digits)
}

export function generateVerificationCode(): string {
  const code = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return code.toString().padStart(6, '0')
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashVerificationCode(
  verificationId: string,
  code: string,
): Promise<string> {
  return sha256Hex(`${verificationId}:${code}:${getVerificationSecret()}`)
}

export async function hashResetToken(resetToken: string): Promise<string> {
  return sha256Hex(`${resetToken}:${getVerificationSecret()}`)
}

export function maskPhone(phoneDigits: string): string {
  if (phoneDigits.length < 7) {
    return phoneDigits
  }

  const head = phoneDigits.slice(0, 3)
  const tail = phoneDigits.slice(-4)
  return `${head}-****-${tail}`
}

export async function lookupMember(
  supabase: SupabaseClient,
  identifier: string,
): Promise<MemberLookupRow | null> {
  const { data, error } = await supabase.rpc('lookup_member_for_password_reset', {
    p_identifier: identifier,
  })

  if (error) {
    throw error
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') {
    return null
  }

  const userId = (row as MemberLookupRow).user_id
  const phoneDigits = (row as MemberLookupRow).phone_digits

  if (!userId || !phoneDigits) {
    return null
  }

  return { user_id: userId, phone_digits: phoneDigits }
}

export async function invalidatePendingVerifications(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const nowIso = new Date().toISOString()

  await supabase
    .from('phone_verifications')
    .update({ used_at: nowIso })
    .eq('user_id', userId)
    .eq('purpose', 'password_reset')
    .is('used_at', null)
    .is('verified_at', null)
}

export async function getLatestSendCooldown(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data } = await supabase
    .from('phone_verifications')
    .select('created_at')
    .eq('user_id', userId)
    .eq('purpose', 'password_reset')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.created_at) {
    return 0
  }

  const elapsedMs = Date.now() - new Date(data.created_at).getTime()
  const remainingMs = RESEND_COOLDOWN_SECONDS * 1000 - elapsedMs
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0
}
