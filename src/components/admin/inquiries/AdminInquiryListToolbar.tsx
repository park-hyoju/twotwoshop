import type { FormEvent } from 'react'
import type { AdminInquirySearchFilters } from '../../../types/adminInquiry'
import {
  INQUIRY_STATUS_FILTER_OPTIONS,
  INQUIRY_TYPE_FILTER_OPTIONS,
} from '../../../lib/adminInquiryDisplay'

interface AdminInquiryListToolbarProps {
  filters: AdminInquirySearchFilters
  selectedCount: number
  onChange: (field: keyof AdminInquirySearchFilters, value: string) => void
  onSearch: () => void
  onReset: () => void
  onBulkDelete?: () => void
}

export function AdminInquiryListToolbar({
  filters,
  selectedCount,
  onChange,
  onSearch,
  onReset,
  onBulkDelete,
}: AdminInquiryListToolbarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch()
  }

  return (
    <div className="space-y-3 border-b border-neutral-100 px-4 py-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            ⌕
          </span>
          <input
            type="search"
            value={filters.query}
            onChange={(event) => onChange('query', event.target.value)}
            placeholder="고객명, 연락처, 문의내용을 검색해보세요"
            className="w-full rounded-2xl border border-neutral-200/80 bg-neutral-50/80 py-2.5 pl-9 pr-3 text-sm text-neutral-900 outline-none transition-all focus:border-neutral-300 focus:bg-white focus:shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={filters.inquiryType}
            onChange={(event) => onChange('inquiryType', event.target.value)}
            className="rounded-2xl border border-neutral-200/80 bg-white px-3 py-2 text-xs font-medium text-neutral-700 outline-none focus:border-neutral-300"
          >
            {INQUIRY_TYPE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) => onChange('status', event.target.value)}
            className="rounded-2xl border border-neutral-200/80 bg-white px-3 py-2 text-xs font-medium text-neutral-700 outline-none focus:border-neutral-300"
          >
            {INQUIRY_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-2xl bg-neutral-900 py-2 text-xs font-semibold text-white transition-all hover:bg-neutral-800 active:scale-[0.98]"
          >
            검색
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition-all hover:bg-neutral-50"
          >
            초기화
          </button>
        </div>
      </form>

      {selectedCount > 0 && (
        <div className="admin-animate-in flex items-center justify-between rounded-2xl bg-red-50 px-3 py-2 ring-1 ring-red-100">
          <span className="text-xs font-semibold text-red-700">{selectedCount}건 선택</span>
          {onBulkDelete && (
            <button
              type="button"
              onClick={onBulkDelete}
              className="rounded-xl bg-red-600 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-red-700"
            >
              선택 삭제
            </button>
          )}
        </div>
      )}
    </div>
  )
}
