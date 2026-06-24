import type { ReactNode } from 'react'
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
    eligible_cases:
      returnInfo.eligible_cases.trim() || DEFAULT_PRODUCT_RETURN_INFO.eligible_cases,
    ineligible_cases:
      returnInfo.ineligible_cases.trim() || DEFAULT_PRODUCT_RETURN_INFO.ineligible_cases,
    shipping_fee_notes:
      returnInfo.shipping_fee_notes.trim() || DEFAULT_PRODUCT_RETURN_INFO.shipping_fee_notes,
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

function BulletList({ text }: { text: string }) {
  const items = text.split('\n').filter((line) => line.trim())

  if (items.length <= 1) {
    return <p className="whitespace-pre-wrap">{text}</p>
  }

  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function ProductDetailReturnSection({ returnInfo }: ProductDetailReturnSectionProps) {
  const resolved = resolveReturnInfo(returnInfo)

  return (
    <div className="space-y-4">
      <PolicyBlock title="신청 기간">
        <p>{resolved.exchange_period}</p>
      </PolicyBlock>

      <PolicyBlock title="반품 주소">
        <p>{resolved.return_address}</p>
      </PolicyBlock>

      <PolicyBlock title="교환·반품이 가능한 경우">
        <BulletList text={resolved.eligible_cases} />
      </PolicyBlock>

      <PolicyBlock title="교환·반품이 어려운 경우">
        <BulletList text={resolved.ineligible_cases} />
      </PolicyBlock>

      <PolicyBlock title="배송비 안내">
        <BulletList text={resolved.shipping_fee_notes} />
      </PolicyBlock>
    </div>
  )
}
