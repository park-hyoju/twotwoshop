import { Link } from 'react-router-dom'
import { SHIPPING_FEE, calculateOrderTotal } from '../../lib/orderConstants'
import { formatPrice } from '../../lib/formatPrice'
import { ROUTES } from '../../lib/routes'

interface CartSummaryProps {
  productTotal: number
  itemCount: number
  totalQuantity: number
  hasSoldOutItems: boolean
  canCheckout: boolean
}

export function CartSummary({
  productTotal,
  itemCount,
  totalQuantity,
  hasSoldOutItems,
  canCheckout,
}: CartSummaryProps) {
  const totalAmount = calculateOrderTotal(productTotal)

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
      <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">주문 요약</h2>
      <dl className="mt-5 space-y-3 text-base sm:text-lg">
        <div className="flex items-center justify-between text-neutral-600">
          <dt>담긴 상품</dt>
          <dd className="font-semibold text-neutral-900">{totalQuantity}개</dd>
        </div>
        <div className="flex items-center justify-between text-neutral-600">
          <dt>주문 가능 수량</dt>
          <dd className="font-semibold text-neutral-900">{itemCount}개</dd>
        </div>
        <div className="flex items-center justify-between text-neutral-600">
          <dt>총 상품 금액</dt>
          <dd className="font-semibold text-neutral-900">{formatPrice(productTotal)}</dd>
        </div>
        <div className="flex items-center justify-between text-neutral-600">
          <dt>배송비</dt>
          <dd className="font-semibold text-neutral-900">{formatPrice(SHIPPING_FEE)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <dt className="font-semibold text-neutral-900">총 결제 예정 금액</dt>
          <dd className="text-2xl font-bold text-neutral-900 sm:text-3xl">{formatPrice(totalAmount)}</dd>
        </div>
      </dl>

      {hasSoldOutItems && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700 sm:text-lg">
          품절 상품이 포함되어 있어 주문할 수 없습니다. 품절 상품을 삭제해주세요.
        </p>
      )}

      {canCheckout ? (
        <Link
          to={ROUTES.checkout}
          className="mt-6 flex min-h-14 w-full items-center justify-center rounded-xl bg-neutral-900 py-4 text-lg font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          주문하기
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-6 min-h-14 w-full rounded-xl bg-neutral-300 py-4 text-lg font-semibold text-neutral-500 disabled:cursor-not-allowed"
        >
          주문하기
        </button>
      )}

      <Link
        to={ROUTES.products}
        className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border border-neutral-300 bg-white text-base font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 sm:text-lg"
      >
        쇼핑 계속하기
      </Link>
    </aside>
  )
}
