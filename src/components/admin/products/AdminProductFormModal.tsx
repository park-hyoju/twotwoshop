import { useEffect, useState, type FormEvent } from 'react'
import { formatKoreanWonDisplay, parseKoreanWonInput } from '../../../lib/adminMoneyInput'
import { PRODUCT_STATUS_OPTIONS } from '../../../lib/adminProductStatus'
import { generateProductSlugFromName } from '../../../lib/productSlug'
import type {
  AdminProductFormFiles,
  AdminProductFormInput,
} from '../../../types/adminProduct'
import type { ProductCategoryId } from '../../../constants/productCategories'
import type { ProductStatus } from '../../../types/status'
import { ProductCategorySelect } from './ProductCategorySelect'
import { ProductExposureSettings } from './ProductExposureSettings'
import {
  buildAdminProductFormFiles,
  hasDoneGalleryImage,
  isGalleryImageBusy,
  ProductImageGalleryManager,
  type ProductGalleryImage,
} from './ProductImageGalleryManager'

export interface AdminProductFormSubmitPayload {
  input: AdminProductFormInput
  files: AdminProductFormFiles
}

interface AdminProductFormModalProps {
  isOpen: boolean
  isSubmitting: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (payload: AdminProductFormSubmitPayload) => void
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
  description: '',
}

const inputClassName =
  'w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 sm:text-base'

export function AdminProductFormModal({
  isOpen,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: AdminProductFormModalProps) {
  const [form, setForm] = useState<AdminProductFormInput>(EMPTY_FORM)
  const [galleryImages, setGalleryImages] = useState<ProductGalleryImage[]>([])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setForm(EMPTY_FORM)
    setGalleryImages([])
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmit({
      input: { ...form, slug: generateProductSlugFromName(form.name) },
      files: buildAdminProductFormFiles(galleryImages),
    })
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

  function handlePriceChange(raw: string) {
    const parsed = parseKoreanWonInput(raw)
    updateField('price', parsed ?? 0)
  }

  function handleStockChange(raw: string) {
    const digits = raw.replace(/[^\d]/g, '')
    updateField('stock', digits === '' ? 0 : Number.parseInt(digits, 10))
  }

  const priceDisplay = formatKoreanWonDisplay(form.price > 0 ? form.price : null)
  const isGalleryBusy = galleryImages.some(isGalleryImageBusy)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-form-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="admin-product-form-title" className="text-xl font-bold text-neutral-900">
          상품 추가
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          빠르게 등록한 뒤 상세 수정에서 정가·상세 설명·옵션·배송 정보를 입력하세요.
        </p>

        <form
          onSubmit={handleSubmit}
          onDragOver={(event) => event.preventDefault()}
          className="mt-6 space-y-5"
        >
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
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-price" className="mb-2 block text-sm font-medium text-neutral-700">
                판매가
              </label>
              <input
                id="product-price"
                inputMode="numeric"
                required
                value={priceDisplay}
                onChange={(event) => handlePriceChange(event.target.value)}
                placeholder="0원"
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="product-stock" className="mb-2 block text-sm font-medium text-neutral-700">
                재고 수량
              </label>
              <input
                id="product-stock"
                inputMode="numeric"
                required
                value={form.stock === 0 ? '' : String(form.stock)}
                onChange={(event) => handleStockChange(event.target.value)}
                placeholder="0"
                className={inputClassName}
                disabled={isSubmitting}
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
                판매 상태
              </label>
              <select
                id="product-status"
                value={form.status}
                onChange={(event) => updateField('status', event.target.value as ProductStatus)}
                className={inputClassName}
                disabled={isSubmitting}
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

          <div>
            <label htmlFor="product-description" className="mb-2 block text-sm font-medium text-neutral-700">
              상품 설명
            </label>
            <textarea
              id="product-description"
              rows={4}
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              className={`${inputClassName} resize-y`}
              disabled={isSubmitting}
              placeholder="간단한 소개 (상세 설명은 상세 수정에서 입력)"
            />
          </div>

          <ProductImageGalleryManager
            images={galleryImages}
            onChange={setGalleryImages}
            productId={null}
            required
            disabled={isSubmitting}
          />

          {!hasDoneGalleryImage(galleryImages) && (
            <p className="text-xs text-neutral-500">대표 이미지 1장 이상 등록해 주세요.</p>
          )}

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
              disabled={isSubmitting || isGalleryBusy || !hasDoneGalleryImage(galleryImages)}
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 sm:text-base"
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
