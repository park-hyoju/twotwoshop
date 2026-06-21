import { useEffect, useState, type FormEvent } from 'react'
import {
  DISPLAY_CATEGORY_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
} from '../../../lib/adminProductStatus'
import type { AdminProductFormInput, AdminProductRow } from '../../../types/adminProduct'
import type { DisplayCategory } from '../../../types/displayCategory'
import type { ProductStatus } from '../../../types/status'

export type AdminProductFormMode = 'create' | 'edit'

interface AdminProductFormModalProps {
  mode: AdminProductFormMode
  product: AdminProductRow | null
  isOpen: boolean
  isSubmitting: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (input: AdminProductFormInput) => void
}

const EMPTY_FORM: AdminProductFormInput = {
  slug: '',
  name: '',
  price: 0,
  stock: 0,
  status: 'active',
  display_category: 'misc',
  gender: 'common',
}

const inputClassName =
  'w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 sm:text-base'

function toFormInput(product: AdminProductRow): AdminProductFormInput {
  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    stock: product.stock,
    status: product.status,
    display_category: (product.display_category as DisplayCategory) ?? 'misc',
    gender: 'common',
  }
}

export function AdminProductFormModal({
  mode,
  product,
  isOpen,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: AdminProductFormModalProps) {
  const [form, setForm] = useState<AdminProductFormInput>(EMPTY_FORM)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (mode === 'edit' && product) {
      setForm(toFormInput(product))
      return
    }

    setForm(EMPTY_FORM)
  }, [isOpen, mode, product])

  if (!isOpen) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(form)
  }

  function updateField<K extends keyof AdminProductFormInput>(
    field: K,
    value: AdminProductFormInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-form-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="admin-product-form-title" className="text-xl font-bold text-neutral-900">
          {mode === 'create' ? '상품 추가' : '상품 수정'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'create' && (
            <>
              <div>
                <label htmlFor="product-slug" className="mb-2 block text-sm font-medium text-neutral-700">
                  slug
                </label>
                <input
                  id="product-slug"
                  required
                  value={form.slug}
                  onChange={(event) => updateField('slug', event.target.value)}
                  placeholder="new-product-slug"
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="product-name" className="mb-2 block text-sm font-medium text-neutral-700">
                  상품명
                </label>
                <input
                  id="product-name"
                  required
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className={inputClassName}
                />
              </div>
            </>
          )}

          {mode === 'edit' && product && (
            <div className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">{product.name}</p>
              <p className="mt-1 text-neutral-500">{product.slug}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-price" className="mb-2 block text-sm font-medium text-neutral-700">
                가격
              </label>
              <input
                id="product-price"
                type="number"
                min={0}
                required
                value={form.price}
                onChange={(event) => updateField('price', Number(event.target.value))}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="product-stock" className="mb-2 block text-sm font-medium text-neutral-700">
                재고
              </label>
              <input
                id="product-stock"
                type="number"
                min={0}
                required
                value={form.stock}
                onChange={(event) => updateField('stock', Number(event.target.value))}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-category" className="mb-2 block text-sm font-medium text-neutral-700">
                카테고리
              </label>
              <select
                id="product-category"
                value={form.display_category}
                onChange={(event) =>
                  updateField('display_category', event.target.value as DisplayCategory)
                }
                className={inputClassName}
              >
                {DISPLAY_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="product-status" className="mb-2 block text-sm font-medium text-neutral-700">
                상태
              </label>
              <select
                id="product-status"
                value={form.status}
                onChange={(event) => updateField('status', event.target.value as ProductStatus)}
                className={inputClassName}
              >
                {PRODUCT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 sm:text-base"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 sm:text-base"
            >
              {isSubmitting ? '저장 중...' : mode === 'create' ? '등록' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
