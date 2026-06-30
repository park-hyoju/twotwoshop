import type { ReactNode } from 'react'
import {
  DEFAULT_PRODUCT_SHIPPING_INFO,
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
    additional_notes:
      shippingInfo.additional_notes.trim() || DEFAULT_PRODUCT_SHIPPING_INFO.additional_notes,
  }
}

function PolicyBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5">
      <h3 className="text-sm font-semibold text-neutral-500">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-neutral-800">{children}</div>
    </div>
  )
}

export function ProductDetailShippingSection({ shippingInfo }: ProductDetailShippingSectionProps) {
  const resolved = resolveShippingInfo(shippingInfo)

  return (
    <div className="space-y-4">
      <PolicyBlock title="배송비">
        <p>{resolved.shipping_fee}</p>
      </PolicyBlock>

      <PolicyBlock title="무료배송 안내">
        <p>{resolved.free_shipping_threshold}</p>
      </PolicyBlock>

      <PolicyBlock title="배송기간">
        <p className="whitespace-pre-wrap">{resolved.delivery_period}</p>
      </PolicyBlock>

      <PolicyBlock title="추가 안내">
        <p className="whitespace-pre-wrap">{resolved.additional_notes}</p>
      </PolicyBlock>
    </div>
  )
}
