import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  getAdminAuthErrorMessage,
  useAdminAuth,
} from '../../contexts/AdminAuthProvider'
import { resolveSafeInternalPath } from '../../lib/safeRedirect'
import { ADMIN_ROUTES } from '../../lib/adminRoutes'
import { isSupabaseConfigured } from '../../lib/supabase'
import { ROUTES } from '../../lib/routes'

function getRedirectPath(from: unknown): string {
  return resolveSafeInternalPath(from, {
    fallback: ADMIN_ROUTES.dashboard,
    allowedPrefix: '/admin',
    disallowedPaths: [ADMIN_ROUTES.login],
  })
}

function getLocationMessage(state: unknown): string | null {
  if (typeof state === 'object' && state !== null && 'message' in state) {
    const message = state.message
    return typeof message === 'string' ? message : null
  }

  return null
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, unauthorizedMessage, clearUnauthorizedMessage } = useAdminAuth()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const redirectPath = getRedirectPath(
    typeof location.state === 'object' && location.state !== null && 'from' in location.state
      ? location.state.from
      : undefined,
  )

  const accessDeniedMessage =
    getLocationMessage(location.state) ?? unauthorizedMessage

  useEffect(() => {
    if (accessDeniedMessage) {
      setErrorMessage(accessDeniedMessage)
      clearUnauthorizedMessage()
    }
  }, [accessDeniedMessage, clearUnauthorizedMessage])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await signIn(loginId.trim(), password)
      navigate(redirectPath, { replace: true })
    } catch (error) {
      setErrorMessage(getAdminAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-neutral-500">TWOTWOSHOP</p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">관리자 로그인</h1>

        {!isSupabaseConfigured && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Supabase 환경변수가 설정되지 않았습니다. `.env.local`을 확인해주세요.
          </p>
        )}

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-login-id" className="block text-sm font-medium text-neutral-700">
              아이디
            </label>
            <input
              id="admin-login-id"
              type="text"
              autoComplete="username"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              disabled={isSubmitting || !isSupabaseConfigured}
              placeholder="admin"
              className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 disabled:bg-neutral-50"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-neutral-700">
              비밀번호
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting || !isSupabaseConfigured}
              className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 disabled:bg-neutral-50"
              required
            />
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isSupabaseConfigured}
            className="w-full rounded-xl bg-neutral-900 py-3 text-base font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>

      <Link
        to={ROUTES.home}
        className="mt-6 text-base text-neutral-600 transition-colors hover:text-neutral-900"
      >
        ← 쇼핑몰로 돌아가기
      </Link>
    </div>
  )
}
