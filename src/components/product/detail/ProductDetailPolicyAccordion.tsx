import {
  DEFAULT_PRODUCT_RETURN_INFO,
  DEFAULT_PRODUCT_SHIPPING_INFO,
} from '../../../types/productDetail'
import { ProductDetailReturnSection } from './ProductDetailReturnSection'
import { ProductDetailShippingSection } from './ProductDetailShippingSection'

export function ProductDetailPolicyAccordion() {
  return (
    <div className="space-y-3">
      <details className="group rounded-2xl border border-neutral-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-4 text-base font-semibold text-neutral-900 marker:content-none sm:px-5">
          <span className="flex items-center justify-between gap-3">
            배송안내
            <span className="text-sm font-normal text-neutral-400 group-open:hidden">펼치기</span>
          </span>
        </summary>
        <div className="border-t border-neutral-100 px-4 pb-5 pt-4 sm:px-5">
          <ProductDetailShippingSection shippingInfo={DEFAULT_PRODUCT_SHIPPING_INFO} />
        </div>
      </details>

      <details className="group rounded-2xl border border-neutral-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-4 text-base font-semibold text-neutral-900 marker:content-none sm:px-5">
          <span className="flex items-center justify-between gap-3">
            교환·반품
            <span className="text-sm font-normal text-neutral-400 group-open:hidden">펼치기</span>
          </span>
        </summary>
        <div className="border-t border-neutral-100 px-4 pb-5 pt-4 sm:px-5">
          <ProductDetailReturnSection returnInfo={DEFAULT_PRODUCT_RETURN_INFO} />
        </div>
      </details>
    </div>
  )
}
