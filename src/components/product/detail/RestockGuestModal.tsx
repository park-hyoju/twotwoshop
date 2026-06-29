import { useState, type FormEvent } from 'react'

interface RestockGuestModalProps {
  isOpen: boolean
  isSubmitting: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (input: {
    customerName: string
    phone: string
    email: string
    agreedToPrivacy: boolean
  }) => void
}

const inputClassName =
  'w-full rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 outline-none focus:border-neutral-500'

export function RestockGuestModal({
  isOpen,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: RestockGuestModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!isOpen) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    if (!customerName.trim()) {
      setValidationError('이름을 입력해주세요.')
      return
    }

    if (!phone.trim()) {
      setValidationError('연락처를 입력해주세요.')
      return
    }

    if (!agreedToPrivacy) {
      setValidationError('개인정보 수집에 동의해주세요.')
      return
    }

    onSubmit({
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      agreedToPrivacy,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restock-guest-modal-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-7"
      >
        <h2 id="restock-guest-modal-title" className="text-xl font-bold text-neutral-900">
          재입고 알림 신청
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600 sm:text-base">
          재입고되면 입력하신 연락처로 알려드릴게요.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="restock-guest-name" className="mb-2 block text-sm font-medium text-neutral-700">
              이름 <span className="text-red-600">*</span>
            </label>
            <input
              id="restock-guest-name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className={inputClassName}
              placeholder="홍길동"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="restock-guest-phone" className="mb-2 block text-sm font-medium text-neutral-700">
              연락처 <span className="text-red-600">*</span>
            </label>
            <input
              id="restock-guest-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClassName}
              placeholder="01012345678"
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="restock-guest-email" className="mb-2 block text-sm font-medium text-neutral-700">
              이메일 <span className="text-neutral-400">(선택)</span>
            </label>
            <input
              id="restock-guest-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
              placeholder="example@email.com"
              autoComplete="email"
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <input
              type="checkbox"
              checked={agreedToPrivacy}
              onChange={(event) => setAgreedToPrivacy(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm leading-6 text-neutral-700">
              재입고 알림 제공을 위한 개인정보 수집·이용에 동의합니다. <span className="text-red-600">*</span>
            </span>
          </label>

          {(validationError || errorMessage) && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError ?? errorMessage}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {isSubmitting ? '신청 중...' : '알림 신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
