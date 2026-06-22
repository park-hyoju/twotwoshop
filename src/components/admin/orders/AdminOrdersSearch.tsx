import type { FormEvent } from 'react'
import type { AdminOrderSearchFilters } from '../../../types/adminOrder'
import { ORDER_STATUS_FILTER_OPTIONS } from '../../../lib/adminOrderStatus'

interface AdminOrdersSearchProps {
  filters: AdminOrderSearchFilters
  onChange: (field: keyof AdminOrderSearchFilters, value: string) => void
  onSearch: () => void
  onReset: () => void
}

const labelClassName = 'mb-1 block text-xs font-medium text-neutral-600 sm:text-sm'
const inputClassName =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500'

export function AdminOrdersSearch({
  filters,
  onChange,
  onSearch,
  onReset,
}: AdminOrdersSearchProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4"
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="admin-order-number" className={labelClassName}>
            주문번호
          </label>
          <input
            id="admin-order-number"
            type="search"
            value={filters.orderNumber}
            onChange={(event) => onChange('orderNumber', event.target.value)}
            placeholder="TT-20260622-642377"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="admin-customer-name" className={labelClassName}>
            주문자
          </label>
          <input
            id="admin-customer-name"
            type="search"
            value={filters.customerName}
            onChange={(event) => onChange('customerName', event.target.value)}
            placeholder="홍길동"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="admin-customer-phone" className={labelClassName}>
            연락처
          </label>
          <input
            id="admin-customer-phone"
            type="search"
            value={filters.phone}
            onChange={(event) => onChange('phone', event.target.value)}
            placeholder="010-1234-5678"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="admin-order-status" className={labelClassName}>
            상태
          </label>
          <select
            id="admin-order-status"
            value={filters.status}
            onChange={(event) => onChange('status', event.target.value)}
            className={inputClassName}
          >
            {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 lg:justify-end">
          <button
            type="submit"
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 lg:flex-none"
          >
            검색
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 lg:flex-none"
          >
            초기화
          </button>
        </div>
      </div>
    </form>
  )
}
