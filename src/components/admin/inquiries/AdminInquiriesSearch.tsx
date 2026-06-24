import type { FormEvent } from 'react'
import type { AdminInquirySearchFilters } from '../../../types/adminInquiry'
import {
  INQUIRY_STATUS_FILTER_OPTIONS,
  INQUIRY_TYPE_FILTER_OPTIONS,
} from '../../../lib/adminInquiryDisplay'

interface AdminInquiriesSearchProps {
  filters: AdminInquirySearchFilters
  onChange: (field: keyof AdminInquirySearchFilters, value: string) => void
  onSearch: () => void
  onReset: () => void
}

const labelClassName = 'mb-0.5 block text-[11px] font-medium text-neutral-500 sm:text-xs'
const inputClassName =
  'w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-500'

export function AdminInquiriesSearch({
  filters,
  onChange,
  onSearch,
  onReset,
}: AdminInquiriesSearchProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 rounded-lg border border-neutral-200 bg-white p-2.5 sm:p-3"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <label htmlFor="admin-inquiry-query" className={labelClassName}>
            검색
          </label>
          <input
            id="admin-inquiry-query"
            type="search"
            value={filters.query}
            onChange={(event) => onChange('query', event.target.value)}
            placeholder="고객명, 연락처, 이메일, 문의내용"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="admin-inquiry-type" className={labelClassName}>
            문의유형
          </label>
          <select
            id="admin-inquiry-type"
            value={filters.inquiryType}
            onChange={(event) => onChange('inquiryType', event.target.value)}
            className={inputClassName}
          >
            {INQUIRY_TYPE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-inquiry-status" className={labelClassName}>
            상태
          </label>
          <select
            id="admin-inquiry-status"
            value={filters.status}
            onChange={(event) => onChange('status', event.target.value)}
            className={inputClassName}
          >
            {INQUIRY_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="submit"
          className="inline-flex min-h-8 items-center justify-center rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          검색
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-8 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-1.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          초기화
        </button>
      </div>
    </form>
  )
}
