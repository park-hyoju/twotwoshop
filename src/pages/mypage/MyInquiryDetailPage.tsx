import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MyPageShell } from '../../components/mypage/MyPageShell'
import {
  getInquiryStatusLabel,
  getInquiryTypeLabel,
  INQUIRY_STATUS_BADGE_CLASSES,
} from '../../lib/adminInquiryDisplay'
import { formatDateTime } from '../../lib/formatDateTime'
import { ROUTES } from '../../lib/routes'
import { useCustomerAuth } from '../../contexts/CustomerAuthProvider'
import {
  CustomerInquiryRepositoryError,
  fetchCustomerInquiryById,
  markCustomerInquiryAsRead,
} from '../../services/customerInquiryRepository'
import type { CustomerInquiryThread } from '../../types/customerInquiry'

export function MyInquiryDetailPage() {
  const { inquiryId } = useParams<{ inquiryId: string }>()
  const { profile } = useCustomerAuth()
  const [inquiry, setInquiry] = useState<CustomerInquiryThread | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const profileName = profile?.name ?? ''
  const profilePhone = profile?.phone ?? ''

  useEffect(() => {
    const currentInquiryId = inquiryId

    if (!currentInquiryId || !profileName || !profilePhone) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function loadInquiry() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const thread = await fetchCustomerInquiryById({
          inquiryId: currentInquiryId as string,
          name: profileName,
          phone: profilePhone,
        })

        if (!cancelled) {
          setInquiry(thread)

          if (thread) {
            await markCustomerInquiryAsRead({
              inquiryId: currentInquiryId as string,
              name: profileName,
              phone: profilePhone,
            })
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof CustomerInquiryRepositoryError
              ? error.message
              : '문의 상세를 불러오지 못했습니다.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInquiry()

    return () => {
      cancelled = true
    }
  }, [inquiryId, profileName, profilePhone])

  return (
    <MyPageShell
      title="문의 상세"
      backHref={ROUTES.mypageInquiries}
      backLabel="문의내역"
    >
      {isLoading ? (
        <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-500 shadow-sm">
          문의 내용을 불러오는 중...
        </p>
      ) : errorMessage ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : !inquiry ? (
        <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-500 shadow-sm">
          문의를 찾을 수 없습니다.
        </p>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-neutral-500">
                  {inquiry.inquiry_code ? `#${inquiry.inquiry_code}` : '문의'} · {getInquiryTypeLabel(inquiry.type)}
                </p>
                <p className="mt-2 text-sm text-neutral-500">{formatDateTime(inquiry.created_at)}</p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${INQUIRY_STATUS_BADGE_CLASSES[inquiry.status]}`}
              >
                {getInquiryStatusLabel(inquiry.status)}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-neutral-900">{inquiry.message}</p>
          </section>

          {inquiry.admin_reply ? (
            <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
              <p className="text-sm font-semibold text-neutral-900">관리자 답변</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{inquiry.admin_reply}</p>
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-500">
              아직 등록된 답변이 없습니다.
            </section>
          )}

          {inquiry.messages.length > 0 ? (
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-neutral-900">대화 내역</h2>
              <ul className="mt-4 space-y-3">
                {inquiry.messages.map((message) => (
                  <li
                    key={message.id}
                    className={`rounded-xl px-4 py-3 text-sm ${
                      message.sender === 'admin'
                        ? 'bg-neutral-100 text-neutral-800'
                        : 'bg-white ring-1 ring-neutral-200 text-neutral-900'
                    }`}
                  >
                    <p className="mb-1 text-xs font-medium text-neutral-500">
                      {message.sender === 'admin' ? '관리자' : '나'} · {formatDateTime(message.created_at)}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Link
            to={ROUTES.mypageInquiries}
            className="inline-flex text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            ← 문의 목록으로
          </Link>
        </div>
      )}
    </MyPageShell>
  )
}
