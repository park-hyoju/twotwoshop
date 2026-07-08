import {
  DEFAULT_PRODUCT_RETURN_INFO,
  DEFAULT_PRODUCT_SHIPPING_INFO,
} from '../../../types/productDetail'

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-3 last:border-b-0 sm:flex-row sm:gap-6">
      <dt className="w-28 shrink-0 text-sm font-semibold text-neutral-500">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm leading-6 text-neutral-800">{value}</dd>
    </div>
  )
}

export function ProductDetailPolicyAccordion() {
  const shipping = DEFAULT_PRODUCT_SHIPPING_INFO
  const returns = DEFAULT_PRODUCT_RETURN_INFO

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
          <dl>
            <PolicyRow label="배송비" value={shipping.shipping_fee} />
            <PolicyRow label="무료배송 조건" value={shipping.free_shipping_threshold} />
            <PolicyRow label="출고기간" value={shipping.delivery_period} />
          </dl>
        </div>
      </details>

      <details className="group rounded-2xl border border-neutral-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-4 text-base font-semibold text-neutral-900 marker:content-none sm:px-5">
          <span className="flex items-center justify-between gap-3">
            교환/반품
            <span className="text-sm font-normal text-neutral-400 group-open:hidden">펼치기</span>
          </span>
        </summary>
        <div className="border-t border-neutral-100 px-4 pb-5 pt-4 sm:px-5">
          <dl>
            <PolicyRow label="교환 가능 기간" value={returns.exchange_period} />
            <PolicyRow label="반품 주소" value={returns.return_address} />
          </dl>
        </div>
      </details>
    </div>
  )
}
