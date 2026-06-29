import { useState, type FormEvent } from 'react'
import {
  CustomerInquiryRepositoryError,
  fetchCustomerInquiryById,
  lookupCustomerInquiriesByContact,
} from '../../services/customerInquiryRepository'
import type { CustomerInquirySummary, CustomerInquiryThread } from '../../types/customerInquiry'
import { InquiryListPicker } from './InquiryListPicker'
import {
  CHAT_INPUT_CLASSNAME,
  CHAT_PRIMARY_BUTTON_CLASSNAME,
} from './chatMessengerStyles'

interface InquiryLookupFormProps {
  onBack: () => void
  onFound: (thread: CustomerInquiryThread) => void
}

const labelClassName = 'mb-1.5 block text-sm font-medium text-neutral-700'

export function InquiryLookupForm({ onBack, onFound }: InquiryLookupFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inquiryList, setInquiryList] = useState<CustomerInquirySummary[] | null>(null)
  const [lookupIdentity, setLookupIdentity] = useState<{ name: string; phone: string } | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setInquiryList(null)
    setIsSubmitting(true)

    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()

    try {
      const inquiries = await lookupCustomerInquiriesByContact({
        name: trimmedName,
        phone: trimmedPhone,
      })

      if (inquiries.length === 0) {
        setErrorMessage('문의 내역을 찾을 수 없습니다. 이름과 연락처를 확인해 주세요.')
        return
      }

      if (inquiries.length === 1) {
        const thread = await fetchCustomerInquiryById({
          inquiryId: inquiries[0].id,
          name: trimmedName,
          phone: trimmedPhone,
        })

        if (!thread) {
          setErrorMessage('문의 내역을 찾을 수 없습니다. 이름과 연락처를 확인해 주세요.')
          return
        }

        onFound(thread)
        return
      }

      setLookupIdentity({ name: trimmedName, phone: trimmedPhone })
      setInquiryList(inquiries)
    } catch (error) {
      setErrorMessage(
        error instanceof CustomerInquiryRepositoryError
          ? error.message
          : '문의 조회 중 오류가 발생했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSelectInquiry(inquiryId: string) {
    if (!lookupIdentity) {
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const thread = await fetchCustomerInquiryById({
        inquiryId,
        name: lookupIdentity.name,
        phone: lookupIdentity.phone,
      })

      if (!thread) {
        setErrorMessage('문의 내역을 불러오지 못했습니다.')
        return
      }

      onFound(thread)
    } catch (error) {
      setErrorMessage(
        error instanceof CustomerInquiryRepositoryError
          ? error.message
          : '문의 조회 중 오류가 발생했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (inquiryList && lookupIdentity) {
    return (
      <InquiryListPicker
        inquiries={inquiryList}
        onSelect={handleSelectInquiry}
        onBack={() => {
          setInquiryList(null)
          setLookupIdentity(null)
        }}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800"
      >
        ← 홈으로
      </button>

      <div className="rounded-2xl bg-white p-4 shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
        <p className="text-base font-semibold text-neutral-900">내 문의 확인하기</p>
        <p className="mt-1 text-sm text-neutral-600">
          접수 시 입력하신 이름과 연락처로 문의 내역을 확인할 수 있습니다.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="lookup-name" className={labelClassName}>
              이름
            </label>
            <input
              id="lookup-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={CHAT_INPUT_CLASSNAME}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="lookup-phone" className={labelClassName}>
              연락처
            </label>
            <input
              id="lookup-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={CHAT_INPUT_CLASSNAME}
              autoComplete="tel"
            />
          </div>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`${CHAT_PRIMARY_BUTTON_CLASSNAME} mt-4`}
        >
          {isSubmitting ? '조회 중...' : '문의 조회'}
        </button>
      </div>
    </form>
  )
}
