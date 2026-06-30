import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AuthFormCard,
  authErrorClassName,
  authInputClassName,
  authLabelClassName,
  authSubmitButtonClassName,
} from '../../components/customer/AuthFormCard'
import { getCustomerAuthErrorMessage } from '../../contexts/CustomerAuthProvider'
import {
  PASSWORD_RESET_INVALID_LINK_MESSAGE,
  PASSWORD_RESET_SUCCESS_MESSAGE,
} from '../../lib/passwordResetConfig'
import { ROUTES } from '../../lib/routes'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { completePasswordReset } from '../../services/customerAuthService'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isCheckingLink, setIsCheckingLink] = useState(true)
  const [isRecoveryReady, setIsRecoveryReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsCheckingLink(false)
      return
    }

    let cancelled = false

    async function verifyRecoverySession() {
      const {
        data: { session },
      } = await supabase!.auth.getSession()

      if (cancelled) {
        return
      }

      if (session) {
        setIsRecoveryReady(true)
        setIsCheckingLink(false)
        return
      }

      setIsCheckingLink(false)
    }

    void verifyRecoverySession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) {
        return
      }

      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsRecoveryReady(true)
        setIsCheckingLink(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting || !isRecoveryReady) {
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await completePasswordReset(newPassword, confirmPassword)
      navigate(ROUTES.signin, {
        replace: true,
        state: { signupSuccess: PASSWORD_RESET_SUCCESS_MESSAGE },
      })
    } catch (error) {
      setErrorMessage(getCustomerAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      title="새 비밀번호 설정"
      description="새로 사용할 비밀번호를 입력해주세요. 영문과 숫자를 포함해 8자 이상이어야 합니다."
      footer={
        <p className="text-center text-sm text-neutral-600">
          <Link
            to={ROUTES.forgotPassword}
            className="font-semibold text-neutral-900 underline-offset-2 hover:underline"
          >
            비밀번호 찾기 다시하기
          </Link>
        </p>
      }
    >
      {!isSupabaseConfigured && (
        <p role="alert" className={`${authErrorClassName} mb-4`}>
          Supabase 환경변수가 설정되지 않았습니다. `.env.local`을 확인해주세요.
        </p>
      )}

      {isCheckingLink ? (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          비밀번호 재설정 링크를 확인하는 중입니다...
        </p>
      ) : !isRecoveryReady ? (
        <div className="space-y-4">
          <p role="alert" className={authErrorClassName}>
            {PASSWORD_RESET_INVALID_LINK_MESSAGE}
          </p>
          <Link
            to={ROUTES.forgotPassword}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-neutral-900 text-base font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            비밀번호 찾기로 이동
          </Link>
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div>
            <label htmlFor="reset-password-new" className={authLabelClassName}>
              새 비밀번호
            </label>
            <input
              id="reset-password-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={isSubmitting || !isSupabaseConfigured}
              className={authInputClassName}
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="reset-password-confirm" className={authLabelClassName}>
              새 비밀번호 확인
            </label>
            <input
              id="reset-password-confirm"
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

          {errorMessage ? (
            <p role="alert" className={authErrorClassName}>
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !isSupabaseConfigured}
            className={authSubmitButtonClassName}
          >
            {isSubmitting ? '변경 중...' : '비밀번호 변경하기'}
          </button>
        </form>
      )}
    </AuthFormCard>
  )
}
