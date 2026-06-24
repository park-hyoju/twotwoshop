import { useEffect, useState, type FormEvent } from 'react'
import { formatDateTime } from '../../../lib/formatDateTime'
import { INQUIRY_STATUS_OPTIONS } from '../../../lib/adminInquiryDisplay'
import type { AdminInquiryRow, DbInquiryStatus } from '../../../types/adminInquiry'
import { InquiryStatusBadge, InquiryTypeBadge } from './InquiryBadges'

interface AdminInquiryDetailModalProps {
  inquiry: AdminInquiryRow | null
  isOpen: boolean
  isSubmitting: boolean
  errorMessage: string | null
  onClose: () => void
  onSave: (input: { status: DbInquiryStatus; adminReply: string; adminNote: string }) => void
}

const inputClassName =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-900">{value}</dd>
    </div>
  )
}

export function AdminInquiryDetailModal({
  inquiry,
  isOpen,
  isSubmitting,
  errorMessage,
  onClose,
  onSave,
}: AdminInquiryDetailModalProps) {
  const [status, setStatus] = useState<DbInquiryStatus>('pending')
  const [adminReply, setAdminReply] = useState('')
  const [adminNote, setAdminNote] = useState('')

  useEffect(() => {
    if (!isOpen || !inquiry) {
      return
    }

    setStatus(inquiry.status)
    setAdminReply(inquiry.admin_reply ?? '')
    setAdminNote(inquiry.admin_note ?? '')
  }, [inquiry, isOpen])

  if (!isOpen || !inquiry) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ status, adminReply, adminNote })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-inquiry-detail-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="admin-inquiry-detail-title" className="text-xl font-bold text-neutral-900">
              {inquiry.inquiry_number}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              접수 {formatDateTime(inquiry.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <InquiryTypeBadge type={inquiry.inquiry_type} />
          <InquiryStatusBadge status={inquiry.status} />
        </div>

        <section className="mt-6 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">고객 정보</h3>
          <dl className="space-y-2">
            <InfoRow label="고객명" value={inquiry.customer_name} />
            <InfoRow label="연락처" value={inquiry.customer_phone} />
            <InfoRow label="이메일" value={inquiry.customer_email ?? '-'} />
          </dl>
        </section>

        <section className="mt-4 rounded-xl border border-neutral-200 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">문의 내용</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
            {inquiry.message}
          </p>
        </section>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-neutral-200 pt-6">
          <div>
            <label htmlFor="admin-inquiry-status" className="mb-2 block text-sm font-medium text-neutral-700">
              상태
            </label>
            <select
              id="admin-inquiry-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as DbInquiryStatus)}
              className={inputClassName}
            >
              {INQUIRY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-inquiry-reply" className="mb-2 block text-sm font-medium text-neutral-700">
              관리자 답변
            </label>
            <textarea
              id="admin-inquiry-reply"
              rows={5}
              value={adminReply}
              onChange={(event) => setAdminReply(event.target.value)}
              placeholder="고객에게 전달할 답변을 입력하세요."
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="admin-inquiry-note" className="mb-2 block text-sm font-medium text-neutral-700">
              관리자 메모
            </label>
            <textarea
              id="admin-inquiry-note"
              rows={3}
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="내부 참고용 메모 (고객 비노출)"
              className={inputClassName}
            />
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
