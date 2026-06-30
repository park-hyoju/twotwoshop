import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DepositAccountInfo } from '../../components/deposit/DepositAccountInfo'
import { ShippingFeeRow } from '../../components/orders/ShippingFeeRow'
import { MyPageShell } from '../../components/mypage/MyPageShell'
import { OrderShippingTracking } from '../../components/orders/OrderShippingTracking'
import { OrderStatusTimeline } from '../../components/orders/OrderStatusTimeline'
import { getOrderStatusBadgeClassName, getOrderStatusLabel, getPaymentStatusLabel } from '../../lib/adminOrderStatus'
import { formatDateTime } from '../../lib/formatDateTime'
import { formatPrice } from '../../lib/formatPrice'
import { ROUTES } from '../../lib/routes'
import {
  CustomerOrderRepositoryError,
  fetchMemberOrderById,
} from '../../services/customerOrderRepository'
import type { MemberOrderDetail } from '../../types/mypage'

export function MyOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<MemberOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const currentOrderId = orderId

    if (!currentOrderId) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function loadOrder() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextOrder = await fetchMemberOrderById(currentOrderId as string)
        if (!cancelled) {
          setOrder(nextOrder)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof CustomerOrderRepositoryError
              ? error.message
              : '주문 상세를 불러오지 못했습니다.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadOrder()

    return () => {
      cancelled = true
    }
  }, [orderId])

  const recipientName = order?.recipientName ?? order?.customerName ?? ''
  const recipientPhone = order?.recipientPhone ?? order?.customerPhone ?? ''

  return (
    <MyPageShell
      title="주문 상세"
      description="주문 정보와 배송지, 상품 내역을 확인할 수 있습니다."
      backHref={ROUTES.mypageOrders}
      backLabel="주문내역"
    >
      {isLoading ? (
        <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-500 shadow-sm">
          주문 상세를 불러오는 중...
        </p>
      ) : errorMessage ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : !order ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center shadow-sm">
          <p className="text-sm text-neutral-600">주문을 찾을 수 없습니다.</p>
          <Link
            to={ROUTES.mypageOrders}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            주문내역으로
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-neutral-500">주문번호 {order.orderNumber}</p>
                <p className="mt-2 text-sm text-neutral-500">{formatDateTime(order.createdAt)}</p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${getOrderStatusBadgeClassName(order.status)}`}
              >
                {getOrderStatusLabel(order.status)}
              </span>
            </div>

            <OrderStatusTimeline status={order.status} className="mt-6 border-t border-neutral-100 pt-5" />
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-neutral-900">결제 정보</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">상품 금액</dt>
                <dd className="font-medium text-neutral-900">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.couponDiscountAmount > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-500">쿠폰 할인</dt>
                  <dd className="font-medium text-red-600">-{formatPrice(order.couponDiscountAmount)}</dd>
                </div>
              ) : null}
              <ShippingFeeRow
                subtotal={order.subtotal}
                shippingFee={order.shippingFee}
              />
              <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-3">
                <dt className="font-semibold text-neutral-900">최종 입금금액</dt>
                <dd className="text-lg font-bold text-neutral-900">{formatPrice(order.totalAmount)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">입금자명</dt>
                <dd className="font-medium text-neutral-900">{order.depositorName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">입금상태</dt>
                <dd className="font-medium text-neutral-900">{getPaymentStatusLabel(order.paymentStatus)}</dd>
              </div>
            </dl>
          </section>

          {order.status === 'pending_payment' ? (
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <DepositAccountInfo showCopyButton />
            </section>
          ) : null}

          <OrderShippingTracking order={order} />

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-neutral-900">배송지 정보</h2>
            <dl className="mt-4 space-y-2 text-sm text-neutral-700">
              <div>
                <dt className="text-neutral-500">받는 분</dt>
                <dd className="mt-0.5 font-medium text-neutral-900">{recipientName}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">연락처</dt>
                <dd className="mt-0.5">{recipientPhone}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">주소</dt>
                <dd className="mt-0.5 leading-relaxed">
                  {order.zipcode ? `(${order.zipcode}) ` : ''}
                  {order.address1 ?? ''}
                  {order.address2 ? ` ${order.address2}` : ''}
                </dd>
              </div>
              {order.memo ? (
                <div>
                  <dt className="text-neutral-500">배송메모</dt>
                  <dd className="mt-0.5">{order.memo}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-neutral-900">주문 상품</h2>
            <ul className="mt-4 divide-y divide-neutral-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900">{item.productName}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {formatPrice(item.unitPrice)} · {item.quantity}개
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-neutral-900">
                    {formatPrice(item.totalPrice)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </MyPageShell>
  )
}
