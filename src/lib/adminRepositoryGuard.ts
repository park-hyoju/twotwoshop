import { ADMIN_UNAUTHORIZED_MESSAGE } from './adminAuthConfig'
import { verifyAdminUser } from './adminAccess'
import { isSupabaseConfigured, supabase } from './supabase'

export class AdminRepositoryAccessError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminRepositoryAccessError'
    this.cause = cause
  }
}

const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.'

const ADMIN_LOGIN_REQUIRED_MESSAGE = '관리자 로그인이 필요합니다.'

export async function assertAdminRepositoryAccess(
  ErrorType: new (message: string, cause?: unknown) => Error = AdminRepositoryAccessError,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new ErrorType(SUPABASE_NOT_CONFIGURED_MESSAGE)
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new ErrorType(ADMIN_LOGIN_REQUIRED_MESSAGE, error)
  }

  const isAdmin = await verifyAdminUser(user)
  if (!isAdmin) {
    throw new ErrorType(ADMIN_UNAUTHORIZED_MESSAGE)
  }
}
