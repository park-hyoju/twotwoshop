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
    return '이메일 또는 비밀번호가 올바르지 않습니다.'
  }

  if (message.includes('Email not confirmed')) {
    return '이메일 인증이 완료되지 않았습니다.'
  }

  return message
}

export async function getAdminSession(): Promise<Session | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new AdminAuthError('로그인 상태를 확인하지 못했습니다.', error)
  }

  return data.session
}

export async function signInAdmin(email: string, password: string): Promise<Session> {
  assertSupabaseReady()

  const trimmedEmail = email.trim()

  if (!trimmedEmail || !password) {
    throw new AdminAuthError('이메일과 비밀번호를 입력해주세요.')
  }

  const { data, error } = await supabase!.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  })

  if (error) {
    throw new AdminAuthError(mapAuthErrorMessage(error.message), error)
  }

  if (!data.session) {
    throw new AdminAuthError('로그인에 실패했습니다.')
  }

  return data.session
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
