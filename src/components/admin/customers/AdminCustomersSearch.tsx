import type { FormEvent } from 'react'
import type { AdminCustomerSearchFilters } from '../../../types/adminCustomer'
import {
  CUSTOMER_QUICK_FILTER_OPTIONS,
  CUSTOMER_SORT_OPTIONS,
  getCustomerQuickFilter,
  type CustomerQuickFilter,
} from '../../../lib/adminCustomerFilters'

interface AdminCustomersSearchProps {
  filters: AdminCustomerSearchFilters
  onQueryChange: (query: string) => void
  onQuickFilterChange: (quickFilter: CustomerQuickFilter) => void
  onSortChange: (sort: AdminCustomerSearchFilters['sort']) => void
  onSearch: () => void
  onReset: () => void
}

const labelClassName = 'mb-0.5 block text-[11px] font-medium text-neutral-500 sm:text-xs'
const inputClassName =
  'w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-500'

export function AdminCustomersSearch({
  filters,
  onQueryChange,
  onQuickFilterChange,
  onSortChange,
  onSearch,
  onReset,
}: AdminCustomersSearchProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 rounded-lg border border-neutral-200 bg-white p-2.5 sm:p-3"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="admin-customer-query" className={labelClassName}>
            검색
          </label>
          <input
            id="admin-customer-query"
            type="search"
            value={filters.query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="고객명, 연락처, 이메일"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="admin-customer-filter" className={labelClassName}>
            필터
          </label>
          <select
            id="admin-customer-filter"
            value={getCustomerQuickFilter(filters)}
            onChange={(event) => onQuickFilterChange(event.target.value as CustomerQuickFilter)}
            className={inputClassName}
          >
            {CUSTOMER_QUICK_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-customer-sort" className={labelClassName}>
            정렬
          </label>
          <select
            id="admin-customer-sort"
            value={filters.sort}
            onChange={(event) =>
              onSortChange(event.target.value as AdminCustomerSearchFilters['sort'])
            }
            className={inputClassName}
          >
            {CUSTOMER_SORT_OPTIONS.map((option) => (
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
