import { formatDateTime } from '../../../lib/formatDateTime'
import type { AdminInquiryRow } from '../../../types/adminInquiry'
import { InquiryStatusBadge, InquiryTypeBadge } from './InquiryBadges'

interface AdminInquiriesListProps {
  inquiries: AdminInquiryRow[]
  onInquiryClick: (inquiry: AdminInquiryRow) => void
}

function truncateMessage(message: string, maxLength = 60): string {
  const trimmed = message.trim()

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength)}...`
}

export function AdminInquiriesList({ inquiries, onInquiryClick }: AdminInquiriesListProps) {
  return (
    <>
      <div className="space-y-2 md:hidden">
        {inquiries.map((inquiry) => (
          <article
            key={inquiry.id}
            className="cursor-pointer rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            onClick={() => onInquiryClick(inquiry)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onInquiryClick(inquiry)
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-neutral-900">{inquiry.customer_name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{inquiry.inquiry_number}</p>
              </div>
              <InquiryStatusBadge status={inquiry.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <InquiryTypeBadge type={inquiry.inquiry_type} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-neutral-700">{inquiry.message}</p>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-neutral-500">
              <span>{inquiry.customer_phone}</span>
              <span>{formatDateTime(inquiry.created_at)}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 overflow-auto rounded-lg border border-neutral-200 bg-white md:block">
        <table className="min-w-[960px] w-full table-fixed">
          <thead className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="w-[7.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                문의번호
              </th>
              <th className="w-[5.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                고객명
              </th>
              <th className="w-[7rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                연락처
              </th>
              <th className="w-[5.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                문의유형
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                문의내용
              </th>
              <th className="w-[4.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                상태
              </th>
              <th className="w-[8rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                접수일
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {inquiries.map((inquiry) => (
              <tr
                key={inquiry.id}
                className="cursor-pointer text-sm text-neutral-800 transition-colors hover:bg-neutral-50"
                onClick={() => onInquiryClick(inquiry)}
              >
                <td className="px-3 py-2.5 font-medium text-neutral-900">{inquiry.inquiry_number}</td>
                <td className="px-3 py-2.5">{inquiry.customer_name}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{inquiry.customer_phone}</td>
                <td className="px-3 py-2.5">
                  <InquiryTypeBadge type={inquiry.inquiry_type} />
                </td>
                <td className="px-3 py-2.5">
                  <span className="line-clamp-2 text-neutral-700" title={inquiry.message}>
                    {truncateMessage(inquiry.message)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <InquiryStatusBadge status={inquiry.status} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-xs text-neutral-600">
                  {formatDateTime(inquiry.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
