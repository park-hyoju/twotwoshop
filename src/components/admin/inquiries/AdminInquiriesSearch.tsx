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
      className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label htmlFor="admin-inquiry-query" className="mb-1.5 block text-xs font-semibold text-neutral-500">
            검색
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              🔍
            </span>
            <input
              id="admin-inquiry-query"
              type="search"
              value={filters.query}
              onChange={(event) => onChange('query', event.target.value)}
              placeholder="고객명, 연락처, 문의내용을 검색해보세요"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:w-[22rem]">
          <div>
            <label htmlFor="admin-inquiry-type" className="mb-1.5 block text-xs font-semibold text-neutral-500">
              문의유형
            </label>
            <select
              id="admin-inquiry-type"
              value={filters.inquiryType}
              onChange={(event) => onChange('inquiryType', event.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white"
            >
              {INQUIRY_TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-inquiry-status" className="mb-1.5 block text-xs font-semibold text-neutral-500">
              상태
            </label>
            <select
              id="admin-inquiry-status"
              value={filters.status}
              onChange={(event) => onChange('status', event.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white"
            >
              {INQUIRY_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 lg:pb-0.5">
          <button
            type="submit"
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 lg:flex-none"
          >
            검색
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            초기화
          </button>
        </div>
      </div>
    </form>
  )
}
