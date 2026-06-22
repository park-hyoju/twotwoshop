import {
  ADMIN_INVALID_CREDENTIALS_MESSAGE,
  ADMIN_UNAUTHORIZED_MESSAGE,
  isAllowedAdminEmail,
  resolveAdminLoginId,
} from '../lib/adminAuthConfig'
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

async function rejectUnauthorizedSession(): Promise<void> {
  if (!supabase) {
    return
  }

  await supabase.auth.signOut()
}

export async function ensureAllowedAdminSession(
  session: Session | null,
): Promise<{ session: Session | null; unauthorized: boolean }> {
  if (!session) {
    return { session: null, unauthorized: false }
  }

  if (isAllowedAdminEmail(session.user.email)) {
    return { session, unauthorized: false }
  }

  await rejectUnauthorizedSession()
  return { session: null, unauthorized: true }
}

export async function getAdminSession(): Promise<{
  session: Session | null
  unauthorized: boolean
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { session: null, unauthorized: false }
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new AdminAuthError('로그인 상태를 확인하지 못했습니다.', error)
  }

  return ensureAllowedAdminSession(data.session)
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

  const { session, unauthorized } = await ensureAllowedAdminSession(data.session)

  if (unauthorized) {
    throw new AdminAuthError(ADMIN_UNAUTHORIZED_MESSAGE)
  }

  if (!session) {
    throw new AdminAuthError('로그인에 실패했습니다.')
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
