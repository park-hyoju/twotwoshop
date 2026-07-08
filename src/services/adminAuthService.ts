import {
  ADMIN_INVALID_CREDENTIALS_MESSAGE,
  ADMIN_UNAUTHORIZED_MESSAGE,
  resolveAdminLoginId,
} from '../lib/adminAuthConfig'
import { verifyAdminUser } from '../lib/adminAccess'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

export class AdminAuthError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminAuthError'
    this.cause = cause
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminAuthError(
      'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.',
    )
  }
}

function mapAuthErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return ADMIN_INVALID_CREDENTIALS_MESSAGE
  }

  if (message.includes('Email not confirmed')) {
    return '이메일 인증이 완료되지 않았습니다.'
  }

  return message
}

/**
 * Reads admin session state without mutating the shared Supabase auth session.
 * Storefront customer sessions must NOT trigger a global signOut here.
 */
export async function resolveAdminSessionState(session: Session | null): Promise<{
  session: Session | null
  unauthorized: boolean
}> {
  if (!session) {
    return { session: null, unauthorized: false }
  }

  if (await verifyAdminUser(session.user)) {
    return { session, unauthorized: false }
  }

  return { session: null, unauthorized: true }
}

async function rejectUnauthorizedSession(): Promise<void> {
  if (!supabase) {
    return
  }

  await supabase.auth.signOut()
}

/** @deprecated Prefer resolveAdminSessionState for passive session reads. */
export async function ensureAllowedAdminSession(
  session: Session | null,
): Promise<{ session: Session | null; unauthorized: boolean }> {
  const resolved = await resolveAdminSessionState(session)

  if (session && !resolved.session) {
    await rejectUnauthorizedSession()
    return { session: null, unauthorized: true }
  }

  return resolved
}

export async function getAdminSession(): Promise<{
  session: Session | null
  unauthorized: boolean
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { session: null, unauthorized: false }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    throw new AdminAuthError('로그인 상태를 확인하지 못했습니다.', sessionError)
  }

  if (!sessionData.session) {
    return { session: null, unauthorized: false }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { session: null, unauthorized: false }
  }

  return resolveAdminSessionState({ ...sessionData.session, user: userData.user })
}

export async function signInAdmin(loginId: string, password: string): Promise<Session> {
  assertSupabaseReady()

  const trimmedLoginId = loginId.trim()

  if (!trimmedLoginId || !password) {
    throw new AdminAuthError('아이디와 비밀번호를 입력해주세요.')
  }

  const email = resolveAdminLoginId(trimmedLoginId)

  const { data, error } = await supabase!.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new AdminAuthError(mapAuthErrorMessage(error.message), error)
  }

  if (!data.session) {
    throw new AdminAuthError('로그인에 실패했습니다.')
  }

  const { data: refreshed, error: refreshError } = await supabase!.auth.refreshSession()
  const session = refreshed.session ?? data.session

  if (refreshError && import.meta.env.DEV) {
    console.warn('[adminAuthService] refreshSession after signIn:', refreshError.message)
  }

  const { data: userData, error: userError } = await supabase!.auth.getUser()
  const user = userData.user ?? session.user

  if (userError && import.meta.env.DEV) {
    console.warn('[adminAuthService] getUser after signIn:', userError.message)
  }

  if (!(await verifyAdminUser(user))) {
    await rejectUnauthorizedSession()
    throw new AdminAuthError(ADMIN_UNAUTHORIZED_MESSAGE)
  }

  return session
}

export async function signOutAdmin(): Promise<void> {
  assertSupabaseReady()

  const { error } = await supabase!.auth.signOut()

  if (error) {
    throw new AdminAuthError('로그아웃에 실패했습니다.', error)
  }
}

export function getAdminUser(session: Session | null): User | null {
  return session?.user ?? null
}
