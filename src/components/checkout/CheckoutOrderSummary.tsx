import { formatPrice } from '../../lib/formatPrice'
import { isCartItemAvailable } from '../../lib/cartItem'
import type { CartItem } from '../../types/cart'

interface CheckoutOrderSummaryProps {
  items: CartItem[]
  productTotal: number
  shippingFee: number
  totalAmount: number
}

export function CheckoutOrderSummary({
  items,
  productTotal,
  shippingFee,
  totalAmount,
}: CheckoutOrderSummaryProps) {
  const orderableItems = items.filter(isCartItemAvailable)

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
      <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">주문 상품</h2>

      <ul className="mt-5 space-y-4">
        {orderableItems.map((item) => (
          <li
            key={item.productId}
            className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4 last:border-b-0 last:pb-0"
          >
            <div>
              <p className="text-base font-semibold text-neutral-900 sm:text-lg">{item.name}</p>
              <p className="mt-1 text-base text-neutral-600 sm:text-lg">수량 {item.quantity}개</p>
            </div>
            <p className="text-base font-bold text-neutral-900 sm:text-lg">
              {formatPrice(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-3 border-t border-neutral-200 pt-5 text-base sm:text-lg">
        <div className="flex items-center justify-between text-neutral-600">
          <dt>총 상품 금액</dt>
          <dd className="font-semibold text-neutral-900">{formatPrice(productTotal)}</dd>
        </div>
        <div className="flex items-center justify-between text-neutral-600">
          <dt>배송비</dt>
          <dd className="font-semibold text-neutral-900">{formatPrice(shippingFee)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <dt className="font-semibold text-neutral-900">총 결제 예정 금액</dt>
          <dd className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            {formatPrice(totalAmount)}
          </dd>
        </div>
      </dl>
    </aside>
  )
}
