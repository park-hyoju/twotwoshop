import { formatPrice } from '../../../../lib/formatPrice'
import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'

interface AdminProductPreviewProps {
  form: AdminProductDetailForm
}

function PreviewImage({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-neutral-200 text-neutral-500">
        이미지 없음
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-neutral-100">
      <img src={src} alt={alt} className="aspect-square w-full object-cover" />
    </div>
  )
}

export function AdminProductPreview({ form }: AdminProductPreviewProps) {
  const isSoldOut = form.status === 'soldout' || form.stock <= 0
  const hasDiscount = form.discount_rate > 0

  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 sm:p-6">
      <p className="mb-4 text-sm font-medium text-neutral-500">
        저장 전 고객 화면 미리보기 (실제 쇼핑몰과 레이아웃이 다를 수 있습니다)
      </p>

      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-4 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <PreviewImage src={form.thumbnail} alt={form.name} />
            {form.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {form.images.map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={image}
                    alt={`${form.name} 상세 ${index + 1}`}
                    className="aspect-square rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            {form.brand && <p className="text-sm font-medium text-neutral-500">{form.brand}</p>}
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{form.name || '상품명'}</h2>
            {form.short_description && (
              <p className="text-base text-neutral-500">{form.short_description}</p>
            )}

            <div className="space-y-2">
              {hasDiscount && (
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-red-600">{form.discount_rate}%</span>
                  <span className="text-lg text-neutral-400 line-through">
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

            {form.description && (
              <div className="whitespace-pre-wrap text-base leading-relaxed text-neutral-600">
                {form.description}
              </div>
            )}

            {form.size_guide.rows.length > 0 && (
              <div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">사이즈 가이드</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50">
                        <th className="px-2 py-2 text-left">사이즈</th>
                        <th className="px-2 py-2 text-left">총장</th>
                        <th className="px-2 py-2 text-left">어깨</th>
                        <th className="px-2 py-2 text-left">가슴</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.size_guide.rows.map((row, index) => (
                        <tr key={index} className="border-t border-neutral-200">
                          <td className="px-2 py-2">{row.size}</td>
                          <td className="px-2 py-2">{row.total_length}</td>
                          <td className="px-2 py-2">{row.shoulder}</td>
                          <td className="px-2 py-2">{row.chest}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {form.size_guide.model_info && (
                  <p className="mt-2 text-sm text-neutral-600">{form.size_guide.model_info}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
