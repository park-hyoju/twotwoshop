import type { FormEvent } from 'react'
import type { AdminOrderSearchFilters } from '../../../types/adminOrder'

interface AdminOrdersSearchProps {
  filters: AdminOrderSearchFilters
  onChange: (field: keyof AdminOrderSearchFilters, value: string) => void
  onSearch: () => void
  onReset: () => void
}

const inputClassName =
  'w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 sm:text-base'

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
      className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="admin-order-number" className="mb-2 block text-sm font-medium text-neutral-700">
            주문번호
          </label>
          <input
            id="admin-order-number"
            type="search"
            value={filters.orderNumber}
            onChange={(event) => onChange('orderNumber', event.target.value)}
            placeholder="TT-2026..."
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="admin-customer-name" className="mb-2 block text-sm font-medium text-neutral-700">
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
          <label htmlFor="admin-customer-phone" className="mb-2 block text-sm font-medium text-neutral-700">
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
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 sm:text-base"
        >
          검색
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 sm:text-base"
        >
          초기화
        </button>
      </div>
    </form>
  )
}
