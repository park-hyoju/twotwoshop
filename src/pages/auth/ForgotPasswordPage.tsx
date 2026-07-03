import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AuthFormCard,
  authErrorClassName,
  authInputClassName,
  authLabelClassName,
  authSubmitButtonClassName,
} from '../../components/customer/AuthFormCard'
import {
  formatPasswordResetCooldownButtonLabel,
  PASSWORD_RESET_RATE_LIMIT_MESSAGE,
  setPasswordResetCooldown,
  usePasswordResetCooldown,
} from '../../lib/passwordResetCooldown'
import {
  formatVerificationExpiryLabel,
  PASSWORD_RESET_SMS_SENT_MESSAGE,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  PASSWORD_RESET_VERIFY_BLOCKED_MESSAGE,
} from '../../lib/passwordResetConfig'
import { ROUTES } from '../../lib/routes'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  completePasswordResetByPhone,
  getPhonePasswordResetErrorMessage,
  isPhonePasswordResetBlockedError,
  isPhonePasswordResetRateLimitError,
  PhonePasswordResetError,
  sendPasswordResetCode,
  verifyPasswordResetCode,
} from '../../services/phonePasswordResetService'

type ForgotPasswordStep = 'identifier' | 'verify' | 'password' | 'success'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<ForgotPasswordStep>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [expiryLabel, setExpiryLabel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const {
    remainingSeconds,
    isCooldownActive,
    startSuccessCooldown,
    startRateLimitCooldown,
  } = usePasswordResetCooldown()

  useEffect(() => {
    if (step !== 'verify' || !expiresAt) {
      return
    }

    function syncExpiryLabel() {
      setExpiryLabel(formatVerificationExpiryLabel(expiresAt))
    }

    syncExpiryLabel()
    const timerId = window.setInterval(syncExpiryLabel, 1000)
    return () => window.clearInterval(timerId)
  }, [expiresAt, step])

  const isSendDisabled =
    isSubmitting || isCooldownActive || !isSupabaseConfigured || step !== 'identifier'

  function resetVerificationState() {
    setVerificationId('')
    setMaskedPhone('')
    setExpiresAt('')
    setResetToken('')
    setVerificationCode('')
    setNewPassword('')
    setConfirmPassword('')
    setStep('identifier')
  }

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSendDisabled) {
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)
    setIsSubmitting(true)

    try {
      const result = await sendPasswordResetCode(identifier)
      setVerificationId(result.verificationId)
      setMaskedPhone(result.maskedPhone)
      setExpiresAt(result.expiresAt)
      setStep('verify')
      startSuccessCooldown()
      setInfoMessage(
        result.mock && import.meta.env.DEV
          ? `${PASSWORD_RESET_SMS_SENT_MESSAGE} (개발 모드: Edge Function 콘솔에서 인증번호를 확인하세요.)`
          : PASSWORD_RESET_SMS_SENT_MESSAGE,
      )
    } catch (error) {
      if (error instanceof PhonePasswordResetError && error.code === 'RESEND_COOLDOWN') {
        if (error.cooldownSeconds && error.cooldownSeconds > 0) {
          setPasswordResetCooldown(error.cooldownSeconds)
        } else {
          startRateLimitCooldown()
        }
        setErrorMessage(error.message)
      } else if (isPhonePasswordResetRateLimitError(error)) {
        startRateLimitCooldown()
        setErrorMessage(PASSWORD_RESET_RATE_LIMIT_MESSAGE)
      } else {
        setErrorMessage(getPhonePasswordResetErrorMessage(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting || step !== 'verify') {
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)
    setIsSubmitting(true)

    try {
      const result = await verifyPasswordResetCode(verificationId, verificationCode)
      setResetToken(result.resetToken)
      setStep('password')
      setInfoMessage('인증이 완료되었습니다. 새 비밀번호를 입력해주세요.')
    } catch (error) {
      if (isPhonePasswordResetBlockedError(error)) {
        setErrorMessage(PASSWORD_RESET_VERIFY_BLOCKED_MESSAGE)
        resetVerificationState()
      } else {
        setErrorMessage(getPhonePasswordResetErrorMessage(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting || step !== 'password' || !resetToken) {
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)
    setIsSubmitting(true)

    try {
      await completePasswordResetByPhone({
        resetToken,
        newPassword,
        confirmPassword,
      })
      navigate(ROUTES.signin, {
        replace: true,
        state: { signupSuccess: PASSWORD_RESET_SUCCESS_MESSAGE },
      })
    } catch (error) {
      setErrorMessage(getPhonePasswordResetErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResendCode() {
    if (isSubmitting || isCooldownActive || !identifier.trim()) {
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)
    setIsSubmitting(true)

    try {
      const result = await sendPasswordResetCode(identifier)
      setVerificationId(result.verificationId)
      setMaskedPhone(result.maskedPhone)
      setExpiresAt(result.expiresAt)
      setVerificationCode('')
      startSuccessCooldown()
      setInfoMessage(PASSWORD_RESET_SMS_SENT_MESSAGE)
    } catch (error) {
      if (error instanceof PhonePasswordResetError && error.code === 'RESEND_COOLDOWN') {
        if (error.cooldownSeconds && error.cooldownSeconds > 0) {
          setPasswordResetCooldown(error.cooldownSeconds)
        } else {
          startRateLimitCooldown()
        }
        setErrorMessage(error.message)
      } else if (isPhonePasswordResetRateLimitError(error)) {
        startRateLimitCooldown()
        setErrorMessage(PASSWORD_RESET_RATE_LIMIT_MESSAGE)
      } else {
        setErrorMessage(getPhonePasswordResetErrorMessage(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepDescription =
    step === 'identifier'
      ? '아이디 또는 가입 시 등록한 전화번호로 본인 확인 후 비밀번호를 재설정합니다.'
      : step === 'verify'
        ? `${maskedPhone} 번호로 발송된 6자리 인증번호를 입력해주세요.`
        : '새로 사용할 비밀번호를 입력해주세요. 영문과 숫자를 포함해 8자 이상이어야 합니다.'

  return (
    <AuthFormCard
      title="비밀번호 찾기"
      description={stepDescription}
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

      {infoMessage ? (
        <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {infoMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p role="alert" className={`${authErrorClassName} mb-4`}>
          {errorMessage}
        </p>
      ) : null}

      {step === 'identifier' ? (
        <form onSubmit={(event) => void handleSendCode(event)} className="space-y-4">
          <div>
            <label htmlFor="forgot-password-identifier" className={authLabelClassName}>
              아이디 또는 전화번호
            </label>
            <input
              id="forgot-password-identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              disabled={isSubmitting || !isSupabaseConfigured}
              placeholder="아이디 또는 01012345678"
              className={authInputClassName}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSendDisabled}
            className={authSubmitButtonClassName}
          >
            {isSubmitting
              ? '확인 중...'
              : formatPasswordResetCooldownButtonLabel(remainingSeconds)}
          </button>
        </form>
      ) : null}

      {step === 'verify' ? (
        <form onSubmit={(event) => void handleVerifyCode(event)} className="space-y-4">
          <div>
            <label htmlFor="forgot-password-code" className={authLabelClassName}>
              인증번호
            </label>
            <input
              id="forgot-password-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              disabled={isSubmitting || !isSupabaseConfigured}
              placeholder="6자리 숫자"
              className={authInputClassName}
              required
              pattern="\d{6}"
            />
            {expiryLabel ? (
              <p className="mt-1.5 text-xs text-neutral-500">{expiryLabel}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isSupabaseConfigured}
            className={authSubmitButtonClassName}
          >
            {isSubmitting ? '확인 중...' : '인증하기'}
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleResendCode()}
              disabled={isSubmitting || isCooldownActive || !isSupabaseConfigured}
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formatPasswordResetCooldownButtonLabel(remainingSeconds, '인증번호 다시 받기')}
            </button>
            <button
              type="button"
              onClick={resetVerificationState}
              disabled={isSubmitting}
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              처음으로
            </button>
          </div>
        </form>
      ) : null}

      {step === 'password' ? (
        <form onSubmit={(event) => void handleResetPassword(event)} className="space-y-4">
          <div>
            <label htmlFor="forgot-password-new" className={authLabelClassName}>
              새 비밀번호
            </label>
            <input
              id="forgot-password-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={isSubmitting || !isSupabaseConfigured}
              placeholder="8자 이상, 영문+숫자"
              className={authInputClassName}
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="forgot-password-confirm" className={authLabelClassName}>
              새 비밀번호 확인
            </label>
            <input
              id="forgot-password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isSubmitting || !isSupabaseConfigured}
              className={authInputClassName}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isSupabaseConfigured}
            className={authSubmitButtonClassName}
          >
            {isSubmitting ? '변경 중...' : '비밀번호 변경하기'}
          </button>
        </form>
      ) : null}
    </AuthFormCard>
  )
}
