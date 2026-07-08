import type { Product } from '../../../types/product'
import { getProductDetailShippingDisplay } from '../../../lib/productDetailPolicyDisplay'

interface ProductDetailShippingSectionProps {
  product: Product
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-4 last:border-b-0 sm:flex-row sm:gap-6">
      <dt className="w-28 shrink-0 text-sm font-semibold text-neutral-500">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm leading-6 text-neutral-800">{value}</dd>
    </div>
  )
}

export function ProductDetailShippingSection({ product }: ProductDetailShippingSectionProps) {
  const shipping = getProductDetailShippingDisplay(product)

  return (
    <dl className="rounded-2xl border border-neutral-200 bg-white px-4 sm:px-5">
      <PolicyRow label="배송비" value={shipping.shippingFee} />
      <PolicyRow label="무료배송 조건" value={shipping.freeShippingCondition} />
      <PolicyRow label="출고 기간" value={shipping.dispatchPeriod} />
      <PolicyRow label="배송 기간" value={shipping.deliveryDuration} />
    </dl>
  )
}
