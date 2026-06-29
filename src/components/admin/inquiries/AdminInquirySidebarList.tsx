import { getInquiryDisplayCode } from '../../../lib/adminInquiryDisplay'
import { getAdminUnreadCount, hasAdminUnreadMessages } from '../../../lib/adminInquiryUnread'
import { formatDateTime } from '../../../lib/formatDateTime'
import { maskPhoneNumber } from '../../../lib/maskPhone'
import type { AdminInquiryRow } from '../../../types/adminInquiry'
import { InquiryStatusBadge, InquiryTypeBadge } from './InquiryBadges'

interface AdminInquirySidebarListProps {
  inquiries: AdminInquiryRow[]
  activeId: string | null
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onSelect: (inquiry: AdminInquiryRow) => void
  onDelete: (inquiry: AdminInquiryRow) => void
}

function truncateMessage(message: string, maxLength = 56): string {
  const trimmed = message.trim()
  return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, maxLength)}...`
}

export function AdminInquirySidebarList({
  inquiries,
  activeId,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSelect,
  onDelete,
}: AdminInquirySidebarListProps) {
  const allSelected = inquiries.length > 0 && inquiries.every((item) => selectedIds.has(item.id))
  const someSelected = inquiries.some((item) => selectedIds.has(item.id))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2">
        <label className="flex items-center gap-2 text-[11px] font-medium text-neutral-500">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(element) => {
              if (element) {
                element.indeterminate = someSelected && !allSelected
              }
            }}
            onChange={onToggleSelectAll}
            className="h-3.5 w-3.5 rounded border-neutral-300"
          />
          전체 선택
        </label>
        <span className="text-[11px] text-neutral-400">{inquiries.length}건</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:thin]">
        <div className="space-y-2">
          {inquiries.map((inquiry, index) => {
            const isActive = activeId === inquiry.id
            const isUnread = hasAdminUnreadMessages(inquiry)
            const unreadCount = getAdminUnreadCount(inquiry)
            const isChecked = selectedIds.has(inquiry.id)

            return (
              <article
                key={inquiry.id}
                className={`admin-animate-in group relative rounded-[20px] border p-3 transition-all duration-200 ${
                  isActive
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                    : isUnread
                      ? 'border-orange-200/80 bg-orange-50/40 hover:border-orange-300'
                      : 'border-neutral-200/70 bg-white hover:border-neutral-300 hover:shadow-sm'
                }`}
                style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleSelect(inquiry.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-neutral-300"
                  />
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelect(inquiry)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`truncate text-sm font-semibold ${isActive ? 'text-white' : 'text-neutral-900'}`}>
                            {inquiry.customer_name}
                          </p>
                          {unreadCount > 0 && (
                            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`mt-0.5 text-[11px] ${isActive ? 'text-white/70' : 'text-neutral-500'}`}>
                          {maskPhoneNumber(inquiry.customer_phone)}
                        </p>
                      </div>
                      {!isActive && <InquiryStatusBadge status={inquiry.status} />}
                    </div>

                    <p
                      className={`mt-2 line-clamp-2 text-xs leading-5 ${
                        isActive ? 'text-white/85' : isUnread ? 'font-medium text-neutral-800' : 'text-neutral-600'
                      }`}
                    >
                      {truncateMessage(inquiry.message)}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {!isActive && <InquiryTypeBadge type={inquiry.inquiry_type} />}
                      <span className={`text-[10px] ${isActive ? 'text-white/60' : 'text-neutral-400'}`}>
                        {formatDateTime(inquiry.created_at)}
                      </span>
                    </div>
                    <p className={`mt-1 text-[10px] ${isActive ? 'text-white/50' : 'text-neutral-400'}`}>
                      {getInquiryDisplayCode(inquiry)}
                    </p>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(inquiry)}
                  className={`absolute right-2 top-2 rounded-lg px-2 py-0.5 text-[10px] font-semibold opacity-0 transition-all group-hover:opacity-100 ${
                    isActive
                      ? 'text-white/80 hover:bg-white/10'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  삭제
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
