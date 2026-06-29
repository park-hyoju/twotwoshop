import { formatDateTime } from '../../lib/formatDateTime'
import { getInquiryTypeLabel } from '../../lib/adminInquiryDisplay'
import type { CustomerInquirySummary } from '../../types/customerInquiry'
import { InquiryStatusBadge } from '../admin/inquiries/InquiryBadges'

interface InquiryListPickerProps {
  inquiries: CustomerInquirySummary[]
  onSelect: (inquiryId: string) => void
  onBack: () => void
}

function truncateMessage(message: string, maxLength = 48): string {
  if (message.length <= maxLength) {
    return message
  }

  return `${message.slice(0, maxLength)}...`
}

export function InquiryListPicker({ inquiries, onSelect, onBack }: InquiryListPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800"
      >
        ← 다시 조회
      </button>

      <div className="rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
        <p className="text-[15px] font-semibold text-neutral-900">문의 내역</p>
        <p className="mt-1 text-sm text-neutral-500">확인할 문의를 선택해 주세요.</p>
      </div>

      <div className="flex flex-col gap-2">
        {inquiries.map((inquiry) => (
          <button
            key={inquiry.id}
            type="button"
            onClick={() => onSelect(inquiry.id)}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-left transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900">
                  {getInquiryTypeLabel(inquiry.type)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                  {truncateMessage(inquiry.message)}
                </p>
              </div>
              <InquiryStatusBadge status={inquiry.status} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
              <span>접수 {formatDateTime(inquiry.created_at)}</span>
              <span>최근 {formatDateTime(inquiry.updated_at)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
