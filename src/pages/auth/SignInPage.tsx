import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AuthFormCard,
  authErrorClassName,
  authInputClassName,
  authLabelClassName,
  authSubmitButtonClassName,
} from '../../components/customer/AuthFormCard'
import {
  getCustomerAuthErrorMessage,
  useCustomerAuth,
} from '../../contexts/CustomerAuthProvider'
import { normalizeLoginEmail } from '../../lib/customerAuthConfig'
import { resolveSafeInternalPath } from '../../lib/safeRedirect'
import { ROUTES } from '../../lib/routes'
import { isSupabaseConfigured } from '../../lib/supabase'

function getRedirectPath(from: unknown): string {
  return resolveSafeInternalPath(from, {
    fallback: ROUTES.mypage,
    disallowedPaths: [ROUTES.signin],
  })
}

export function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useCustomerAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const signupSuccessMessage =
    typeof location.state === 'object' &&
    location.state !== null &&
    'signupSuccess' in location.state &&
    typeof location.state.signupSuccess === 'string'
      ? location.state.signupSuccess
      : null

  const redirectPath = getRedirectPath(
    typeof location.state === 'object' && location.state !== null && 'from' in location.state
      ? location.state.from
      : undefined,
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await signIn(normalizeLoginEmail(email), password)
      navigate(redirectPath, { replace: true })
    } catch (error) {
      setErrorMessage(getCustomerAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      title="로그인"
      description="이메일과 비밀번호로 로그인해주세요."
      footer={
        <p className="text-center text-sm text-neutral-600">
          아직 회원이 아니신가요?{' '}
          <Link to={ROUTES.signup} className="font-semibold text-neutral-900 underline-offset-2 hover:underline">
            회원가입
          </Link>
        </p>
      }
    >
      {!isSupabaseConfigured && (
        <p role="alert" className={`${authErrorClassName} mb-4`}>
          Supabase 환경변수가 설정되지 않았습니다. `.env.local`을 확인해주세요.
        </p>
      )}

      {signupSuccessMessage && (
        <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {signupSuccessMessage}
        </p>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div>
          <label htmlFor="signin-email" className={authLabelClassName}>
            아이디/이메일
          </label>
          <input
            id="signin-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting || !isSupabaseConfigured}
            placeholder="example@test.com"
            className={authInputClassName}
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="signin-password" className={authLabelClassName}>
              비밀번호
            </label>
            <Link
              to={ROUTES.forgotPassword}
              className="text-sm font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting || !isSupabaseConfigured}
            className={authInputClassName}
            required
          />
        </div>

        {errorMessage && (
          <p role="alert" className={authErrorClassName}>
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !isSupabaseConfigured}
          className={authSubmitButtonClassName}
        >
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </AuthFormCard>
  )
}
