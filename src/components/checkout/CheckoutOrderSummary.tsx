import { isCartItemAvailable } from '../../lib/cartItem'
import { getCartLineId, getCartOptionLabel } from '../../lib/cartLine'
import { ShippingFeeRow } from '../orders/ShippingFeeRow'
import { formatPrice } from '../../lib/formatPrice'
import type { CartItem } from '../../types/cart'

interface CheckoutOrderSummaryProps {
  items: CartItem[]
  productTotal: number
  couponDiscount: number
  shippingFee: number
  totalAmount: number
}

export function CheckoutOrderSummary({
  items,
  productTotal,
  couponDiscount,
  shippingFee,
  totalAmount,
}: CheckoutOrderSummaryProps) {
  const orderableItems = items.filter(isCartItemAvailable)

  return (
    <aside className="sticky top-24 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
      <h2 className="text-xl font-bold text-neutral-900">주문 상품</h2>
      <ul className="mt-5 space-y-4">
        {orderableItems.map((item) => {
          const optionLabel = getCartOptionLabel(item)

          return (
          <li key={getCartLineId(item)} className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4 last:border-b-0">
            <div>
              <p className="font-semibold text-neutral-900">{item.name}</p>
              {optionLabel && (
                <p className="mt-1 text-sm text-neutral-600">옵션: {optionLabel}</p>
              )}
              <p className="mt-1 text-sm text-neutral-600">수량 {item.quantity}개</p>
            </div>
            <p className="font-bold text-neutral-900">{formatPrice(item.price * item.quantity)}</p>
          </li>
          )
        })}
      </ul>
      <dl className="mt-6 space-y-2 border-t border-neutral-200 pt-4 text-sm">
        <div className="flex justify-between text-neutral-600">
          <dt>상품금액</dt>
          <dd>{formatPrice(productTotal)}</dd>
        </div>
        <div className="flex justify-between text-neutral-600">
          <dt>쿠폰 할인</dt>
          <dd className="text-red-600">
            {couponDiscount > 0 ? `-${formatPrice(couponDiscount)}` : formatPrice(0)}
          </dd>
        </div>
        <ShippingFeeRow subtotal={productTotal} shippingFee={shippingFee} />
        <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-900">
          <dt>최종 입금금액</dt>
          <dd>{formatPrice(totalAmount)}</dd>
        </div>
      </dl>
    </aside>
  )
}
