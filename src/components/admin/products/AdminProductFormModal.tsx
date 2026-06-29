import { useEffect, useState, type FormEvent } from 'react'
import { resolveProductCategory } from '../../../constants/productCategories'
import { PRODUCT_STATUS_OPTIONS } from '../../../lib/adminProductStatus'
import { fetchAdminRelatedProducts } from '../../../services/adminProductRelatedRepository'
import type { AdminProductFormInput, AdminProductRow } from '../../../types/adminProduct'
import type { RelatedProductPick } from '../../../types/adminProductRelated'
import type { ProductCategoryId } from '../../../constants/productCategories'
import type { ProductStatus } from '../../../types/status'
import { ProductCategorySelect } from './ProductCategorySelect'
import { ProductExposureSettings } from './ProductExposureSettings'
import { RelatedProductsSection } from './RelatedProductsSection'

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
  product_category: 'etc',
  isNew: false,
  isBest: false,
  isSale: false,
  relatedProductIds: [],
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
    product_category: resolveProductCategory({
      product_category: product.product_category,
      display_category: product.display_category,
    }),
    isNew: product.is_new === true,
    isBest: product.is_best === true,
    isSale: product.is_sale === true,
    relatedProductIds: [],
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
  const [relatedProducts, setRelatedProducts] = useState<RelatedProductPick[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)
  const [relatedLoadError, setRelatedLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (mode === 'edit' && product) {
      setForm(toFormInput(product))
      setRelatedProducts([])
      setRelatedLoadError(null)
      setIsLoadingRelated(true)

      void fetchAdminRelatedProducts(product.id)
        .then((items) => {
          setRelatedProducts(items)
          setIsLoadingRelated(false)
        })
        .catch(() => {
          setRelatedLoadError('연관상품을 불러오지 못했습니다.')
          setIsLoadingRelated(false)
        })

      return
    }

    setForm(EMPTY_FORM)
    setRelatedProducts([])
    setRelatedLoadError(null)
    setIsLoadingRelated(false)
  }, [isOpen, mode, product])

  if (!isOpen) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      ...form,
      relatedProductIds: relatedProducts.map((item) => item.id),
    })
  }

  function handleRelatedProductsChange(products: RelatedProductPick[]) {
    setRelatedProducts(products)
  }

  function updateField<K extends keyof AdminProductFormInput>(
    field: K,
    value: AdminProductFormInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateExposureField(field: 'isNew' | 'isBest' | 'isSale', value: boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-form-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
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
              <ProductCategorySelect
                id="product-category"
                value={form.product_category}
                onChange={(value: ProductCategoryId) => updateField('product_category', value)}
                className={inputClassName}
                required
              />
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

          <ProductExposureSettings
            isNew={form.isNew}
            isBest={form.isBest}
            isSale={form.isSale}
            onChange={updateExposureField}
            disabled={isSubmitting}
          />

          <div className="border-t border-neutral-200 pt-4">
            {isLoadingRelated && (
              <p className="text-sm text-neutral-500">연관상품을 불러오는 중...</p>
            )}

            {relatedLoadError && (
              <p role="alert" className="mb-3 text-sm text-red-600">
                {relatedLoadError}
              </p>
            )}

            {!isLoadingRelated && (
              <RelatedProductsSection
                productId={mode === 'edit' ? product?.id ?? null : null}
                selectedProducts={relatedProducts}
                onChange={handleRelatedProductsChange}
                disabled={isSubmitting}
              />
            )}
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
