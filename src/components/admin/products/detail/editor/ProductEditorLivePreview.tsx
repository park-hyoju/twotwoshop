import { formatPrice } from '../../../../../lib/formatPrice'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import { adminCardClassName } from '../adminFormStyles'

interface ProductEditorLivePreviewProps {
  form: AdminProductDetailForm
  compact?: boolean
}

function computeDiscountRate(price: number, originalPrice: number): number {
  if (originalPrice <= 0 || price <= 0 || price >= originalPrice) {
    return 0
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

export function ProductEditorLivePreview({ form, compact = false }: ProductEditorLivePreviewProps) {
  const isSoldOut = form.status === 'soldout' || form.stock <= 0
  const discountRate = computeDiscountRate(form.price, form.original_price)
  const hasDiscount = discountRate > 0
  const previewDescription =
    form.description.trim() || form.short_description.trim() || '상세 설명이 여기에 표시됩니다.'

  return (
    <div className={compact ? '' : 'sticky top-0 p-4'}>
      <div className={adminCardClassName}>
        <p className="mb-4 text-sm font-bold text-neutral-900">실시간 미리보기</p>

        <article className="overflow-hidden rounded-2xl border border-neutral-200">
          <div className="aspect-square bg-neutral-100">
            {form.thumbnail ? (
              <img
                src={form.thumbnail}
                alt={form.name || '상품'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                대표사진
              </div>
            )}
          </div>

          <div className="space-y-2 p-4">
            {form.brand && (
              <p className="text-xs font-medium text-neutral-500">{form.brand}</p>
            )}
            <h4 className="text-base font-bold text-neutral-900">
              {form.name || '상품명을 입력하세요'}
            </h4>
            {form.short_description && (
              <p className="text-sm text-neutral-500">{form.short_description}</p>
            )}

            <div className="flex items-center gap-2">
              {hasDiscount && (
                <span className="text-sm font-bold text-red-600">{discountRate}%</span>
              )}
              <span className="text-lg font-bold text-neutral-900">{formatPrice(form.price)}</span>
              {hasDiscount && (
                <span className="text-sm text-neutral-400 line-through">
                  {formatPrice(form.original_price)}
                </span>
              )}
            </div>

            {isSoldOut && (
              <span className="inline-block rounded-md bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-white">
                품절
              </span>
            )}

            <p className="line-clamp-4 whitespace-pre-wrap border-t border-neutral-100 pt-3 text-xs leading-5 text-neutral-600">
              {previewDescription}
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
