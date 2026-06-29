import { useEffect, useState, type FormEvent } from 'react'
import { uploadInquiryImages } from '../../lib/inquiryImageUpload'
import type { ChatInquiryQuickKey } from '../../lib/chatInquiryTypes'
import {
  CustomerInquiryRepositoryError,
  submitCustomerInquiry,
} from '../../services/customerInquiryRepository'
import { runGuardedSubmit } from '../../utils/submitGuard'
import { validateInquiryFormInput } from '../../utils/validators'
import { InquiryImageUploader } from './InquiryImageUploader'
import {
  CHAT_INPUT_CLASSNAME,
  CHAT_PRIMARY_BUTTON_CLASSNAME,
} from './chatMessengerStyles'

interface InquiryFormProps {
  quickKey: ChatInquiryQuickKey
  onSuccess: () => void
  layout?: 'default' | 'chat'
}

const labelClassName = 'mb-1.5 block text-sm font-medium text-neutral-700'

export function InquiryForm({ quickKey, onSuccess, layout = 'default' }: InquiryFormProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [orderReference, setOrderReference] = useState('')
  const [message, setMessage] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setErrorMessage(null)
  }, [quickKey])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const validationError = validateInquiryFormInput({
      customerName,
      customerPhone,
      customerEmail,
      orderReference,
      message,
    })

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    await runGuardedSubmit(isSubmitting, setIsSubmitting, async () => {
      try {
        const imageUrls = imageFiles.length > 0 ? await uploadInquiryImages(imageFiles) : []

        await submitCustomerInquiry({
          quickKey,
          customerName,
          customerPhone,
          customerEmail,
          orderReference,
          message,
          imageUrls,
        })

        onSuccess()
      } catch (error) {
        setErrorMessage(
          error instanceof CustomerInquiryRepositoryError
            ? error.message
            : error instanceof Error
              ? error.message
              : '문의 접수 중 오류가 발생했습니다.',
        )
      }
    })
  }

  const isChatLayout = layout === 'chat'

  const fields = (
    <>
      <div>
        <label htmlFor="inquiry-name" className={labelClassName}>
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="inquiry-name"
          type="text"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="홍길동"
          className={CHAT_INPUT_CLASSNAME}
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="inquiry-phone" className={labelClassName}>
          연락처 <span className="text-red-500">*</span>
        </label>
        <input
          id="inquiry-phone"
          type="tel"
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
          placeholder="010-1234-5678"
          className={CHAT_INPUT_CLASSNAME}
          autoComplete="tel"
        />
      </div>

      <div>
        <label htmlFor="inquiry-email" className={labelClassName}>
          이메일 <span className="font-normal text-neutral-400">(선택)</span>
        </label>
        <input
          id="inquiry-email"
          type="email"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          placeholder="email@example.com"
          className={CHAT_INPUT_CLASSNAME}
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="inquiry-order-ref" className={labelClassName}>
          주문번호/상품명 <span className="font-normal text-neutral-400">(선택)</span>
        </label>
        <input
          id="inquiry-order-ref"
          type="text"
          value={orderReference}
          onChange={(event) => setOrderReference(event.target.value)}
          placeholder="주문번호 또는 상품명"
          className={CHAT_INPUT_CLASSNAME}
        />
      </div>

      <div>
        <label htmlFor="inquiry-message" className={labelClassName}>
          문의 내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="inquiry-message"
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="궁금하신 내용을 자세히 적어 주세요."
          className={`${CHAT_INPUT_CLASSNAME} resize-none`}
        />
      </div>

      <InquiryImageUploader files={imageFiles} onChange={setImageFiles} disabled={isSubmitting} />

      {errorMessage && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
    </>
  )

  const submitButton = (
    <button type="submit" disabled={isSubmitting} className={CHAT_PRIMARY_BUTTON_CLASSNAME}>
      {isSubmitting ? '접수 중...' : '문의 등록하기'}
    </button>
  )

  if (isChatLayout) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden px-1"
      >
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-3 [scrollbar-width:thin]">
          {fields}
        </div>
        <div className="shrink-0 border-t border-neutral-200/80 bg-[#f4f5f7] pb-1 pt-3">
          {submitButton}
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-1 pb-1">
      {fields}
      {submitButton}
    </form>
  )
}
