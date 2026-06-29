import type { FormEvent } from 'react'
import { ADMIN_CATEGORY_FILTER_OPTIONS } from '../../../constants/productCategories'
import type { AdminProductSearchFilters } from '../../../types/adminProduct'
import { PRODUCT_STATUS_FILTER_OPTIONS } from '../../../lib/adminProductStatus'

interface AdminProductsSearchProps {
  filters: AdminProductSearchFilters
  onChange: (field: keyof AdminProductSearchFilters, value: string) => void
  onSearch: () => void
  onReset: () => void
}

const inputClassName =
  'w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 sm:text-base'

export function AdminProductsSearch({
  filters,
  onChange,
  onSearch,
  onReset,
}: AdminProductsSearchProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="admin-product-name" className="mb-2 block text-sm font-medium text-neutral-700">
            상품명
          </label>
          <input
            id="admin-product-name"
            type="search"
            value={filters.name}
            onChange={(event) => onChange('name', event.target.value)}
            placeholder="상품명 검색"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="admin-product-slug" className="mb-2 block text-sm font-medium text-neutral-700">
            slug
          </label>
          <input
            id="admin-product-slug"
            type="search"
            value={filters.slug}
            onChange={(event) => onChange('slug', event.target.value)}
            placeholder="classic-linen-shirt"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="admin-product-status" className="mb-2 block text-sm font-medium text-neutral-700">
            상태
          </label>
          <select
            id="admin-product-status"
            value={filters.status}
            onChange={(event) => onChange('status', event.target.value)}
            className={inputClassName}
          >
            {PRODUCT_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-product-category" className="mb-2 block text-sm font-medium text-neutral-700">
            카테고리
          </label>
          <select
            id="admin-product-category"
            value={filters.category}
            onChange={(event) => onChange('category', event.target.value)}
            className={inputClassName}
          >
            {ADMIN_CATEGORY_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
