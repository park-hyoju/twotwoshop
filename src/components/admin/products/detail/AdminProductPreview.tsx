import { formatPrice } from '../../../../lib/formatPrice'
import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'
import { adminCardClassName, adminPageStackClassName, adminSectionTitleClassName } from './adminFormStyles'

interface AdminProductPreviewProps {
  form: AdminProductDetailForm
}

function PreviewImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  if (!src) {
    return (
      <div
        className={`flex aspect-square items-center justify-center bg-neutral-100 text-neutral-400 ${className}`}
      >
        이미지 없음
      </div>
    )
  }

  return (
    <img src={src} alt={alt} className={`aspect-square w-full object-cover ${className}`} />
  )
}

export function AdminProductPreview({ form }: AdminProductPreviewProps) {
  const isSoldOut = form.status === 'soldout' || form.stock <= 0
  const hasDiscount = form.discount_rate > 0

  return (
    <div className={adminPageStackClassName}>
      <section className={adminCardClassName}>
        <h3 className={`${adminSectionTitleClassName} mb-6`}>상품 목록 미리보기</h3>
        <div className="mx-auto max-w-xs">
          <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <PreviewImage src={form.thumbnail} alt={form.name} />
            <div className="space-y-3 p-4">
              <h4 className="line-clamp-2 text-base font-bold text-neutral-900">
                {form.name || '상품명'}
              </h4>
              <p className="text-xl font-bold text-neutral-900">{formatPrice(form.price)}</p>
              {isSoldOut && (
                <span className="inline-block rounded-md bg-neutral-800 px-2 py-1 text-xs font-semibold text-white">
                  품절
                </span>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className={adminCardClassName}>
        <h3 className={`${adminSectionTitleClassName} mb-6`}>상품 상세 미리보기</h3>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
          <div className="grid gap-6 p-4 lg:grid-cols-2 lg:p-6">
            <div className="space-y-3">
              <PreviewImage
                src={form.thumbnail}
                alt={form.name}
                className="rounded-2xl"
              />
              {form.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.images.map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`${form.name} ${index + 1}`}
                      className="aspect-square rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-2xl bg-white p-5">
              {form.brand && <p className="text-sm font-medium text-neutral-500">{form.brand}</p>}
              <h2 className="text-2xl font-bold text-neutral-900">{form.name || '상품명'}</h2>
              {form.short_description && (
                <p className="text-base text-neutral-500">{form.short_description}</p>
              )}

              <div className="space-y-1">
                {hasDiscount && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-600">{form.discount_rate}%</span>
                    <span className="text-neutral-400 line-through">
                      {formatPrice(form.original_price)}
                    </span>
                  </div>
                )}
                <p className="text-3xl font-bold text-neutral-900">{formatPrice(form.price)}</p>
              </div>

              {isSoldOut && (
                <span className="inline-block rounded-md bg-neutral-700 px-3 py-1.5 text-sm font-semibold text-white">
                  품절
                </span>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="rounded-xl bg-neutral-900 py-3 text-center text-sm font-semibold text-white">
                  장바구니 담기
                </div>
                <div className="rounded-xl border border-neutral-300 py-3 text-center text-sm font-semibold text-neutral-800">
                  구매하기
                </div>
              </div>

              {form.description && (
                <div className="border-t border-neutral-100 pt-4">
                  <p className="mb-2 text-sm font-bold text-neutral-900">상세정보</p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                    {form.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
