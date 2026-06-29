import { useEffect, useState, type FormEvent } from 'react'
import { MyPageShell } from '../../components/mypage/MyPageShell'
import { useCustomerAuth } from '../../contexts/CustomerAuthProvider'
import { runGuardedSubmit } from '../../utils/submitGuard'
import {
  loadMemberProfileForEdit,
  MypageProfileServiceError,
  updateMemberPassword,
  updateMemberProfile,
} from '../../services/mypageProfileService'

export function MyProfileEditPage() {
  const { user, profile, refreshProfile } = useCustomerAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const currentProfile = profile ?? (await loadMemberProfileForEdit(user.id))
        if (!cancelled) {
          setName(currentProfile?.name?.trim() || '')
          setPhone(currentProfile?.phone?.trim() || '')
          setEmail(currentProfile?.email?.trim() || user.email || '')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [profile, user?.email, user?.id])

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    await runGuardedSubmit(isSavingProfile, setIsSavingProfile, async () => {
      try {
        await updateMemberProfile({ name, phone })
        await refreshProfile()
        setSuccessMessage('회원정보가 저장되었습니다.')
      } catch (error) {
        setErrorMessage(
          error instanceof MypageProfileServiceError
            ? error.message
            : '회원정보 저장에 실패했습니다.',
        )
      }
    })
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    await runGuardedSubmit(isSavingPassword, setIsSavingPassword, async () => {
      try {
        await updateMemberPassword({ newPassword, confirmPassword })
        setNewPassword('')
        setConfirmPassword('')
        setSuccessMessage('비밀번호가 변경되었습니다.')
      } catch (error) {
        setErrorMessage(
          error instanceof MypageProfileServiceError
            ? error.message
            : '비밀번호 변경에 실패했습니다.',
        )
      }
    })
  }

  return (
    <MyPageShell title="회원정보 수정" description="이름, 연락처, 비밀번호를 변경할 수 있습니다.">
      {isLoading ? (
        <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-500 shadow-sm">
          회원정보를 불러오는 중...
        </p>
      ) : (
        <div className="space-y-6">
          <form
            onSubmit={(event) => void handleProfileSubmit(event)}
            className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900">기본 정보</h2>

            <label className="block text-sm">
              <span className="font-medium text-neutral-700">이름</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-neutral-700">전화번호</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="01012345678"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-neutral-700">이메일</span>
              <input
                value={email}
                readOnly
                className="mt-1.5 w-full rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-500"
              />
            </label>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSavingProfile ? '저장 중...' : '정보 저장'}
            </button>
          </form>

          <form
            onSubmit={(event) => void handlePasswordSubmit(event)}
            className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900">비밀번호 변경</h2>

            <label className="block text-sm">
              <span className="font-medium text-neutral-700">새 비밀번호</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                autoComplete="new-password"
                minLength={8}
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-neutral-700">새 비밀번호 확인</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                autoComplete="new-password"
                minLength={8}
              />
            </label>

            <button
              type="submit"
              disabled={isSavingPassword}
              className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-800 disabled:opacity-50"
            >
              {isSavingPassword ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>

          {successMessage ? (
            <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
        </div>
      )}
    </MyPageShell>
  )
}
