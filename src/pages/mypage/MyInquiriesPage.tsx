import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquareText } from 'lucide-react'
import { MyPageEmptyState } from '../../components/mypage/MyPageEmptyState'
import { MyPageShell } from '../../components/mypage/MyPageShell'
import {
  getInquiryStatusLabel,
  getInquiryTypeLabel,
  INQUIRY_STATUS_BADGE_CLASSES,
} from '../../lib/adminInquiryDisplay'
import { formatDateTime } from '../../lib/formatDateTime'
import { mypageInquiryDetailPath } from '../../lib/mypageRoutes'
import { ROUTES } from '../../lib/routes'
import { useCustomerAuth } from '../../contexts/CustomerAuthProvider'
import {
  fetchMemberInquiries,
  MemberInquiryRepositoryError,
} from '../../services/memberInquiryRepository'
import type { MemberInquirySummary } from '../../types/mypage'

export function MyInquiriesPage() {
  const { profile } = useCustomerAuth()
  const [inquiries, setInquiries] = useState<MemberInquirySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasContactInfo = Boolean(profile?.name?.trim() && profile?.phone?.trim())

  useEffect(() => {
    let cancelled = false

    async function loadInquiries() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextInquiries = await fetchMemberInquiries()
        if (!cancelled) {
          setInquiries(nextInquiries)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof MemberInquiryRepositoryError
              ? error.message
              : '문의 내역을 불러오지 못했습니다.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInquiries()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <MyPageShell title="문의내역" description="작성하신 1:1 문의와 답변 상태를 확인할 수 있습니다.">
      {!hasContactInfo ? (
        <MyPageEmptyState
          title="문의 조회를 위해 연락처 정보가 필요합니다"
          description="회원정보 수정에서 이름과 전화번호를 등록하면 문의 내역을 확인할 수 있습니다."
          actionLabel="회원정보 수정"
          actionHref={ROUTES.mypageProfile}
          icon={<MessageSquareText className="h-6 w-6" aria-hidden />}
        />
      ) : isLoading ? (
        <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-500 shadow-sm">
          문의 내역을 불러오는 중...
        </p>
      ) : errorMessage ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : inquiries.length === 0 ? (
        <MyPageEmptyState
          title="문의 내역이 없습니다"
          description="궁금한 점이 있으시면 채팅 문의를 이용해주세요."
          actionLabel="쇼핑 계속하기"
          actionHref={ROUTES.products}
          icon={<MessageSquareText className="h-6 w-6" aria-hidden />}
        />
      ) : (
        <ul className="space-y-3">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <Link
                to={mypageInquiryDetailPath(inquiry.id)}
                className="block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-colors hover:border-neutral-300 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">
                      {inquiry.inquiryCode ? `#${inquiry.inquiryCode}` : '문의'} · {getInquiryTypeLabel(inquiry.type)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-base text-neutral-900">{inquiry.message}</p>
                    <p className="mt-2 text-sm text-neutral-500">{formatDateTime(inquiry.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${INQUIRY_STATUS_BADGE_CLASSES[inquiry.status]}`}
                    >
                      {getInquiryStatusLabel(inquiry.status)}
                    </span>
                    {inquiry.hasUnreadReply ? (
                      <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-white">
                        새 답변
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MyPageShell>
  )
}
