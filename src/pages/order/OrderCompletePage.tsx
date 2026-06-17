import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatPrice } from '../../lib/formatPrice'
import { isValidOrder } from '../../lib/orderStorage'
import { orderRepository } from '../../services/orderRepository'
import { ROUTES } from '../../lib/routes'
import type { Order } from '../../types/order'

function resolveOrder(state: unknown): Order | null {
  const stateOrder = (state as { order?: unknown } | null)?.order

  if (isValidOrder(stateOrder)) {
    return stateOrder
  }

  return orderRepository.getLatestOrder()
}

export function OrderCompletePage() {
  const location = useLocation()
  const [order, setOrder] = useState<Order | null>(() => resolveOrder(location.state))

  useEffect(() => {
    setOrder(resolveOrder(location.state))
  }, [location.key, location.state])

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center sm:p-8">
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            최근 주문 내역이 없습니다.
          </h1>
          <Link
            to={ROUTES.products}
            className="mt-8 inline-flex min-h-14 items-center justify-center rounded-xl bg-neutral-900 px-8 text-lg font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    )
  }

  const fullAddress = [
    order.shipping.postalCode,
    order.shipping.address,
    order.shipping.addressDetail,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          주문이 정상 접수되었습니다.
        </h1>
        <p className="mt-4 text-lg text-neutral-600 sm:text-xl">
          주문 내역을 확인해주세요.
        </p>

        <dl className="mt-8 space-y-4 text-base sm:text-lg">
          <div className="flex flex-col gap-1 border-b border-neutral-100 pb-4 sm:flex-row sm:justify-between">
            <dt className="font-semibold text-neutral-700">주문번호</dt>
            <dd className="font-bold text-neutral-900">{order.orderNumber}</dd>
          </div>
          <div className="flex flex-col gap-1 border-b border-neutral-100 pb-4 sm:flex-row sm:justify-between">
            <dt className="font-semibold text-neutral-700">주문자명</dt>
            <dd className="text-neutral-900">{order.customerName}</dd>
          </div>
          <div className="flex flex-col gap-1 border-b border-neutral-100 pb-4 sm:flex-row sm:justify-between">
            <dt className="font-semibold text-neutral-700">연락처</dt>
            <dd className="text-neutral-900">{order.phone}</dd>
          </div>
          <div className="flex flex-col gap-1 border-b border-neutral-100 pb-4 sm:flex-row sm:justify-between">
            <dt className="font-semibold text-neutral-700">배송지</dt>
            <dd className="text-right text-neutral-900 sm:max-w-md">{fullAddress}</dd>
          </div>
          {order.shipping.memo && (
            <div className="flex flex-col gap-1 border-b border-neutral-100 pb-4 sm:flex-row sm:justify-between">
              <dt className="font-semibold text-neutral-700">배송메모</dt>
              <dd className="text-right text-neutral-900 sm:max-w-md">{order.shipping.memo}</dd>
            </div>
          )}
        </dl>

        <div className="mt-8 border-t border-neutral-200 pt-6">
          <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">주문 상품</h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-neutral-900">{item.name}</p>
                  <p className="mt-1 text-neutral-600">수량 {item.quantity}개</p>
                </div>
                <p className="font-bold text-neutral-900">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <dl className="mt-6 space-y-3 border-t border-neutral-200 pt-6 text-base sm:text-lg">
          <div className="flex items-center justify-between text-neutral-600">
            <dt>총 상품 금액</dt>
            <dd className="font-semibold text-neutral-900">{formatPrice(order.productTotal)}</dd>
          </div>
          <div className="flex items-center justify-between text-neutral-600">
            <dt>배송비</dt>
            <dd className="font-semibold text-neutral-900">{formatPrice(order.shippingFee)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
            <dt className="font-semibold text-neutral-900">총 결제 예정 금액</dt>
            <dd className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              {formatPrice(order.totalAmount)}
            </dd>
          </div>
        </dl>

        <div className="mt-8 rounded-xl bg-neutral-100 px-5 py-4">
          <p className="text-base font-semibold text-neutral-800 sm:text-lg">입금 안내</p>
          <p className="mt-2 text-base text-neutral-600 sm:text-lg">
            주문 확인 후 안내에 따라 입금해 주세요.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to={ROUTES.home}
            className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-neutral-900 py-4 text-lg font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            홈으로
          </Link>
          <Link
            to={ROUTES.products}
            className="flex min-h-14 flex-1 items-center justify-center rounded-xl border border-neutral-300 bg-white py-4 text-lg font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  )
}
