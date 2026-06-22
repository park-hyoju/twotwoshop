import {
  DEFAULT_PRODUCT_SHIPPING_INFO,
  DEFAULT_PRODUCT_SHIPPING_NOTES,
  type ProductShippingInfo,
} from '../../../types/productDetail'

interface ProductDetailShippingSectionProps {
  shippingInfo: ProductShippingInfo
}

function resolveShippingInfo(shippingInfo: ProductShippingInfo): ProductShippingInfo {
  return {
    shipping_fee: shippingInfo.shipping_fee.trim() || DEFAULT_PRODUCT_SHIPPING_INFO.shipping_fee,
    delivery_period:
      shippingInfo.delivery_period.trim() || DEFAULT_PRODUCT_SHIPPING_INFO.delivery_period,
    free_shipping_threshold:
      shippingInfo.free_shipping_threshold.trim() ||
      DEFAULT_PRODUCT_SHIPPING_INFO.free_shipping_threshold,
  }
}

export function ProductDetailShippingSection({ shippingInfo }: ProductDetailShippingSectionProps) {
  const resolved = resolveShippingInfo(shippingInfo)

  return (
    <div className="space-y-4">
      <dl className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
        <div className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-3.5 sm:grid-cols-[9rem_1fr]">
          <dt className="text-sm font-semibold text-neutral-500">배송비</dt>
          <dd className="text-sm leading-6 text-neutral-800">{resolved.shipping_fee}</dd>
        </div>
        <div className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-3.5 sm:grid-cols-[9rem_1fr]">
          <dt className="text-sm font-semibold text-neutral-500">배송기간</dt>
          <dd className="text-sm leading-6 text-neutral-800">{resolved.delivery_period}</dd>
        </div>
        <div className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-3.5 sm:grid-cols-[9rem_1fr]">
          <dt className="text-sm font-semibold text-neutral-500">무료배송</dt>
          <dd className="text-sm leading-6 text-neutral-800">{resolved.free_shipping_threshold}</dd>
        </div>
      </dl>

      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5">
        <h3 className="text-sm font-semibold text-neutral-500">기타 배송 안내</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-700">{DEFAULT_PRODUCT_SHIPPING_NOTES}</p>
      </div>
    </div>
  )
}
