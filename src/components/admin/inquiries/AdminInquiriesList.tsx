import { getInquiryDisplayCode } from '../../../lib/adminInquiryDisplay'
import { getAdminUnreadCount, hasAdminUnreadMessages } from '../../../lib/adminInquiryUnread'
import { formatDateTime } from '../../../lib/formatDateTime'
import { maskPhoneNumber } from '../../../lib/maskPhone'
import type { AdminInquiryRow } from '../../../types/adminInquiry'
import { InquiryStatusBadge, InquiryTypeBadge } from './InquiryBadges'

interface AdminInquiriesListProps {
  inquiries: AdminInquiryRow[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onInquiryClick: (inquiry: AdminInquiryRow) => void
  onDeleteClick: (inquiry: AdminInquiryRow) => void
}

function truncateMessage(message: string, maxLength = 72): string {
  const trimmed = message.trim()

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength)}...`
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null
  }

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function AdminInquiriesList({
  inquiries,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onInquiryClick,
  onDeleteClick,
}: AdminInquiriesListProps) {
  const allSelected = inquiries.length > 0 && inquiries.every((inquiry) => selectedIds.has(inquiry.id))
  const someSelected = inquiries.some((inquiry) => selectedIds.has(inquiry.id))

  return (
    <>
      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2">
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-600">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(element) => {
                if (element) {
                  element.indeterminate = someSelected && !allSelected
                }
              }}
              onChange={onToggleSelectAll}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
            />
            전체 선택
          </label>
          <span className="text-xs text-neutral-500">{selectedIds.size}건 선택</span>
        </div>

        {inquiries.map((inquiry) => {
          const unreadCount = getAdminUnreadCount(inquiry)
          const isUnread = hasAdminUnreadMessages(inquiry)
          const isSelected = selectedIds.has(inquiry.id)

          return (
            <article
              key={inquiry.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                isSelected
                  ? 'border-neutral-900 ring-1 ring-neutral-900/10'
                  : isUnread
                    ? 'border-orange-200/80'
                    : 'border-neutral-200/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(inquiry.id)}
                  onClick={(event) => event.stopPropagation()}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onInquiryClick(inquiry)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-neutral-900 ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                          {inquiry.customer_name}
                        </p>
                        <UnreadBadge count={unreadCount} />
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">{getInquiryDisplayCode(inquiry)}</p>
                    </div>
                    <InquiryStatusBadge status={inquiry.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <InquiryTypeBadge type={inquiry.inquiry_type} />
                  </div>
                  <p
                    className={`mt-2 line-clamp-2 text-sm ${isUnread ? 'font-medium text-neutral-900' : 'text-neutral-700'}`}
                  >
                    {inquiry.message}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-neutral-500">
                    <span>{maskPhoneNumber(inquiry.customer_phone)}</span>
                    <span>{formatDateTime(inquiry.created_at)}</span>
                  </div>
                </button>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDeleteClick(inquiry)}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm md:block">
        <table className="min-w-full">
          <thead className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(element) => {
                    if (element) {
                      element.indeterminate = someSelected && !allSelected
                    }
                  }}
                  onChange={onToggleSelectAll}
                  aria-label="전체 선택"
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                />
              </th>
              <th className="px-3 py-3">고객</th>
              <th className="px-3 py-3">문의내용</th>
              <th className="px-3 py-3">유형</th>
              <th className="px-3 py-3">상태</th>
              <th className="px-3 py-3">접수일</th>
              <th className="w-28 px-3 py-3 text-right">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {inquiries.map((inquiry) => {
              const unreadCount = getAdminUnreadCount(inquiry)
              const isUnread = hasAdminUnreadMessages(inquiry)
              const isSelected = selectedIds.has(inquiry.id)

              return (
                <tr
                  key={inquiry.id}
                  className={`text-sm transition-colors ${
                    isSelected
                      ? 'bg-neutral-50'
                      : isUnread
                        ? 'bg-orange-50/30'
                        : 'hover:bg-neutral-50/70'
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(inquiry.id)}
                      aria-label={`${inquiry.customer_name} 선택`}
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onInquiryClick(inquiry)}
                      className="text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-neutral-900 ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                          {inquiry.customer_name}
                        </span>
                        <UnreadBadge count={unreadCount} />
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {maskPhoneNumber(inquiry.customer_phone)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-neutral-400">{getInquiryDisplayCode(inquiry)}</p>
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onInquiryClick(inquiry)}
                      className="line-clamp-2 max-w-md text-left text-neutral-700 hover:text-neutral-900"
                      title={inquiry.message}
                    >
                      {truncateMessage(inquiry.message)}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <InquiryTypeBadge type={inquiry.inquiry_type} />
                  </td>
                  <td className="px-3 py-3">
                    <InquiryStatusBadge status={inquiry.status} />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-neutral-500">
                    {formatDateTime(inquiry.created_at)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onInquiryClick(inquiry)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
                      >
                        상담
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(inquiry)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
