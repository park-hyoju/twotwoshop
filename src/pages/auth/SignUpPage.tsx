import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import {
  CUSTOMER_SIGNUP_RATE_LIMIT_COOLDOWN_SECONDS,
  parseRateLimitCooldownSeconds,
} from '../../lib/customerAuthConfig'
import { ROUTES } from '../../lib/routes'
import { isSupabaseConfigured } from '../../lib/supabase'
import { sanitizePhone } from '../../utils/sanitize'
import { CustomerAuthError, isSignupRateLimitError } from '../../services/customerAuthService'

function getRateLimitCooldownSeconds(error: unknown): number {
  if (error instanceof CustomerAuthError && error.cause && typeof error.cause === 'object') {
    const cause = error.cause as { message?: string }
    if (typeof cause.message === 'string') {
      const parsed = parseRateLimitCooldownSeconds(cause.message)
      if (parsed) {
        return parsed
      }
    }
  }

  return CUSTOMER_SIGNUP_RATE_LIMIT_COOLDOWN_SECONDS
}

export function SignUpPage() {
  const navigate = useNavigate()
  const { signUp } = useCustomerAuth()
  const submitLockRef = useRef(false)
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [agreedMarketing, setAgreedMarketing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return
    }

    const timerId = window.setInterval(() => {
      setCooldownSeconds((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [cooldownSeconds])

  const isSubmitDisabled =
    isSubmitting || cooldownSeconds > 0 || !isSupabaseConfigured

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) {
      return
    }

    if (submitLockRef.current || isSubmitting || cooldownSeconds > 0) {
      event.preventDefault()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitLockRef.current || isSubmitting || cooldownSeconds > 0) {
      return
    }

    submitLockRef.current = true
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const result = await signUp({
        loginId,
        password,
        passwordConfirm,
        name,
        phone,
        agreedTerms,
        agreedPrivacy,
        agreedMarketing,
      })
      navigate(ROUTES.signin, {
        replace: true,
        state: { signupSuccess: result.successMessage },
      })
    } catch (error) {
      setErrorMessage(getCustomerAuthErrorMessage(error))

      if (isSignupRateLimitError(error)) {
        setCooldownSeconds(getRateLimitCooldownSeconds(error))
      }
    } finally {
      submitLockRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      title="회원가입"
      description="아이디와 비밀번호로 간편하게 가입하세요."
      footer={
        <p className="text-center text-sm text-neutral-600">
          이미 계정이 있으신가요?{' '}
          <Link to={ROUTES.signin} className="font-semibold text-neutral-900 underline-offset-2 hover:underline">
            로그인
          </Link>
        </p>
      }
    >
      {!isSupabaseConfigured && (
        <p role="alert" className={`${authErrorClassName} mb-4`}>
          Supabase 환경변수가 설정되지 않았습니다. `.env.local`을 확인해주세요.
        </p>
      )}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        onKeyDown={handleFormKeyDown}
        className="space-y-4"
        aria-busy={isSubmitting}
      >
        <div>
          <label htmlFor="signup-login-id" className={authLabelClassName}>
            아이디 <span className="text-red-600">*</span>
          </label>
          <input
            id="signup-login-id"
            type="text"
            autoComplete="username"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            disabled={isSubmitDisabled}
            placeholder="영문 소문자와 숫자 4~20자"
            className={authInputClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="signup-name" className={authLabelClassName}>
            이름
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitDisabled}
            placeholder="홍길동"
            className={authInputClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="signup-phone" className={authLabelClassName}>
            전화번호
          </label>
          <input
            id="signup-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(sanitizePhone(event.target.value))}
            disabled={isSubmitDisabled}
            placeholder="01012345678"
            className={authInputClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="signup-password" className={authLabelClassName}>
            비밀번호
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitDisabled}
            placeholder="8자 이상, 영문+숫자"
            className={authInputClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="signup-password-confirm" className={authLabelClassName}>
            비밀번호 확인
          </label>
          <input
            id="signup-password-confirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            disabled={isSubmitDisabled}
            className={authInputClassName}
            required
          />
        </div>

        <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <label className="flex items-start gap-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(event) => setAgreedTerms(event.target.checked)}
              disabled={isSubmitDisabled}
              className="mt-0.5"
            />
            <span>
              <Link to={ROUTES.terms} target="_blank" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
                이용약관
              </Link>
              에 동의합니다. <span className="text-red-600">*</span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={agreedPrivacy}
              onChange={(event) => setAgreedPrivacy(event.target.checked)}
              disabled={isSubmitDisabled}
              className="mt-0.5"
            />
            <span>
              <Link to={ROUTES.privacy} target="_blank" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
                개인정보처리방침
              </Link>
              에 동의합니다. <span className="text-red-600">*</span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={agreedMarketing}
              onChange={(event) => setAgreedMarketing(event.target.checked)}
              disabled={isSubmitDisabled}
              className="mt-0.5"
            />
            <span>마케팅 수신에 동의합니다. (선택)</span>
          </label>
        </div>

        {errorMessage && (
          <p role="alert" className={authErrorClassName}>
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={authSubmitButtonClassName}
        >
          {isSubmitting
            ? '가입 중...'
            : cooldownSeconds > 0
              ? `${cooldownSeconds}초 후 다시 시도`
              : '회원가입'}
        </button>
      </form>
    </AuthFormCard>
  )
}
