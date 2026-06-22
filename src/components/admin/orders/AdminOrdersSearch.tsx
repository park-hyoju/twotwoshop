import type { FormEvent } from 'react'
import type { AdminOrderSearchFilters } from '../../../types/adminOrder'
import { ORDER_STATUS_FILTER_OPTIONS } from '../../../lib/adminOrderStatus'

interface AdminOrdersSearchProps {
  filters: AdminOrderSearchFilters
  onChange: (field: keyof AdminOrderSearchFilters, value: string) => void
  onSearch: () => void
  onReset: () => void
}

const labelClassName = 'mb-0.5 block text-[11px] font-medium text-neutral-500 sm:text-xs'
const inputClassName =
  'w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-500'

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
      className="shrink-0 rounded-lg border border-neutral-200 bg-white p-2.5 sm:p-3"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
