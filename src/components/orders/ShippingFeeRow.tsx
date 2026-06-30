import { formatPrice } from '../../lib/formatPrice'
import {
  calculateShippingFee,
  formatShippingFeeLabel,
  getShippingPolicyHint,
} from '../../lib/orderConstants'

interface ShippingFeeRowProps {
  subtotal: number
  /** When viewing a saved order, pass the stored shipping fee. */
  shippingFee?: number
  hintClassName?: string
}

export function ShippingFeeRow({
  subtotal,
  shippingFee,
  hintClassName = 'text-xs text-neutral-500',
}: ShippingFeeRowProps) {
  const fee = shippingFee ?? calculateShippingFee(subtotal)
  const hint = getShippingPolicyHint(subtotal)

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <dt>배송비</dt>
        <dd className="font-medium text-neutral-900">
          {fee === 0 ? formatShippingFeeLabel(0) : formatPrice(fee)}
        </dd>
      </div>
      <p className={hintClassName}>{hint}</p>
    </>
  )
}
