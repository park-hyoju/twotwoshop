import { hasProductInfoFields, PRODUCT_INFO_LABELS } from '../../../lib/productDetailContent'
import type { ProductInfoFields } from '../../../types/productDetail'

interface ProductDetailInfoSectionProps {
  productInfo: ProductInfoFields
}

export function ProductDetailInfoSection({ productInfo }: ProductDetailInfoSectionProps) {
  if (!hasProductInfoFields(productInfo)) {
    return null
  }

  const visibleFields = PRODUCT_INFO_LABELS.filter(
    (field) => productInfo[field.key].trim().length > 0,
  )

  return (
    <dl className="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
      {visibleFields.map((field) => (
        <div
          key={field.key}
          className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-3.5 sm:grid-cols-[9rem_1fr]"
        >
          <dt className="text-sm font-semibold text-neutral-500">{field.label}</dt>
          <dd className="text-sm leading-6 text-neutral-800">{productInfo[field.key]}</dd>
        </div>
      ))}
    </dl>
  )
}
