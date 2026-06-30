import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AuthFormCard,
  authErrorClassName,
  authInputClassName,
  authLabelClassName,
  authSubmitButtonClassName,
} from '../../components/customer/AuthFormCard'
import { getCustomerAuthErrorMessage } from '../../contexts/CustomerAuthProvider'
import {
  formatPasswordResetCooldownButtonLabel,
  PASSWORD_RESET_RATE_LIMIT_MESSAGE,
  usePasswordResetCooldown,
} from '../../lib/passwordResetCooldown'
import { PASSWORD_RESET_EMAIL_SENT_MESSAGE } from '../../lib/passwordResetConfig'
import { ROUTES } from '../../lib/routes'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  isPasswordResetRateLimitError,
  requestPasswordResetEmail,
} from '../../services/customerAuthService'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    remainingSeconds,
    isCooldownActive,
    startSuccessCooldown,
    startRateLimitCooldown,
  } = usePasswordResetCooldown()

  const isSubmitDisabled =
    isSubmitting || isCooldownActive || !isSupabaseConfigured

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitDisabled) {
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      await requestPasswordResetEmail(email)
      startSuccessCooldown()
      setSuccessMessage(PASSWORD_RESET_EMAIL_SENT_MESSAGE)
    } catch (error) {
      if (isPasswordResetRateLimitError(error)) {
        startRateLimitCooldown()
        setErrorMessage(PASSWORD_RESET_RATE_LIMIT_MESSAGE)
      } else {
        setErrorMessage(getCustomerAuthErrorMessage(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      title="비밀번호 찾기"
      description="가입한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다."
      footer={
        <p className="text-center text-sm text-neutral-600">
          비밀번호가 기억나셨나요?{' '}
          <Link
            to={ROUTES.signin}
            className="font-semibold text-neutral-900 underline-offset-2 hover:underline"
          >
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

      {successMessage ? (
        <div className="space-y-4">
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">
            {successMessage}
          </p>
          <p className="text-sm leading-relaxed text-neutral-600">
            메일이 보이지 않으면 스팸함도 확인해주세요. 링크는 일정 시간이 지나면 만료될 수 있습니다.
          </p>
          {isCooldownActive ? (
            <p className="text-sm text-neutral-500">
              {formatPasswordResetCooldownButtonLabel(remainingSeconds)}
            </p>
          ) : null}
          <Link
            to={ROUTES.signin}
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-neutral-300 bg-white text-base font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div>
            <label htmlFor="forgot-password-email" className={authLabelClassName}>
              이메일
            </label>
            <input
              id="forgot-password-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting || !isSupabaseConfigured}
              placeholder="가입할 때 사용한 이메일"
              className={authInputClassName}
              required
            />
          </div>

          {errorMessage ? (
            <p role="alert" className={authErrorClassName}>
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={authSubmitButtonClassName}
          >
            {isSubmitting
              ? '메일 보내는 중...'
              : formatPasswordResetCooldownButtonLabel(remainingSeconds)}
          </button>
        </form>
      )}
    </AuthFormCard>
  )
}
