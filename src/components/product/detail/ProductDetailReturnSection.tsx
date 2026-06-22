import {
  DEFAULT_PRODUCT_RETURN_INFO,
  type ProductReturnInfo,
} from '../../../types/productDetail'

interface ProductDetailReturnSectionProps {
  returnInfo: ProductReturnInfo
}

function resolveReturnInfo(returnInfo: ProductReturnInfo): ProductReturnInfo {
  return {
    exchange_period:
      returnInfo.exchange_period.trim() || DEFAULT_PRODUCT_RETURN_INFO.exchange_period,
    return_address: returnInfo.return_address.trim() || DEFAULT_PRODUCT_RETURN_INFO.return_address,
    notes: returnInfo.notes.trim() || DEFAULT_PRODUCT_RETURN_INFO.notes,
  }
}

export function ProductDetailReturnSection({ returnInfo }: ProductDetailReturnSectionProps) {
  const resolved = resolveReturnInfo(returnInfo)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5">
        <h3 className="text-sm font-semibold text-neutral-500">교환/반품 기간</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-800">{resolved.exchange_period}</p>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5">
        <h3 className="text-sm font-semibold text-neutral-500">반품 주소</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-800">{resolved.return_address}</p>
      </div>
      <div className="rounded-2xl bg-neutral-50 px-4 py-3.5">
        <h3 className="text-sm font-semibold text-neutral-500">유의사항</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
          {resolved.notes}
        </p>
      </div>
    </div>
  )
}
