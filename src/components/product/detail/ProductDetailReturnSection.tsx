import type { Product } from '../../../types/product'
import { getProductDetailReturnDisplay } from '../../../lib/productDetailPolicyDisplay'

interface ProductDetailReturnSectionProps {
  product: Product
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-4 last:border-b-0 sm:flex-row sm:gap-6">
      <dt className="w-32 shrink-0 text-sm font-semibold text-neutral-500">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm leading-6 text-neutral-800">{value}</dd>
    </div>
  )
}

export function ProductDetailReturnSection({ product }: ProductDetailReturnSectionProps) {
  const returns = getProductDetailReturnDisplay(product)

  return (
    <dl className="rounded-2xl border border-neutral-200 bg-white px-4 sm:px-5">
      <PolicyRow label="교환 가능 기간" value={returns.exchangePeriod} />
      <PolicyRow label="교환 배송비" value={returns.exchangeShippingFee} />
      <PolicyRow label="반품 배송비" value={returns.returnShippingFee} />
      <PolicyRow label="반품 주소" value={returns.returnAddress} />
      <PolicyRow label="교환/반품 불가 사유" value={returns.ineligibleReasons} />
    </dl>
  )
}
