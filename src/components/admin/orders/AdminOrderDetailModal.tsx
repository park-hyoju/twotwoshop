import { formatPrice } from '../../../lib/formatPrice'
import { ShippingFeeRow } from '../../orders/ShippingFeeRow'
import { getOrderStatusLabel, getPaymentStatusLabel } from '../../../lib/adminOrderStatus'
import { formatAdminOrderDate, getOrderProductSummary } from './adminOrderDisplay'
import { AdminOrderFulfillmentPanel } from './AdminOrderFulfillmentPanel'
import { OrderStatusBadge } from './OrderStatusBadge'
import type { AdminOrderFulfillmentAction, AdminOrderRow } from '../../../types/adminOrder'

interface AdminOrderDetailModalProps {
  order: AdminOrderRow | null
  isLoading?: boolean
  errorMessage?: string | null
  isFulfillmentProcessing?: boolean
  fulfillmentErrorMessage?: string | null
  onClose: () => void
  onFulfillmentAction?: (
    action: AdminOrderFulfillmentAction,
    shipping?: { courier: string; trackingNumber: string },
  ) => void | Promise<void>
  onSaveShipping?: (shipping: { courier: string; trackingNumber: string }) => void | Promise<void>
}

export function AdminOrderDetailModal({
  order,
  isLoading = false,
  errorMessage = null,
  isFulfillmentProcessing = false,
  fulfillmentErrorMessage = null,
  onClose,
  onFulfillmentAction,
  onSaveShipping,
}: AdminOrderDetailModalProps) {
  if (!order) {
    return null
  }

  const summary = getOrderProductSummary(order)
  const orderDate = formatAdminOrderDate(order.created_at)
  const recipientName = order.recipient_name ?? order.customer_name
  const recipientPhone = order.recipient_phone ?? order.customer_phone

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-order-detail-title"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 id="admin-order-detail-title" className="text-lg font-bold text-neutral-900">
              주문 상세
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{order.order_number}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            닫기
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-neutral-500">주문 상세를 불러오는 중...</p>
          ) : errorMessage ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : (
            <>
          <div className="flex items-center justify-between gap-3">
            <OrderStatusBadge status={order.status} />
            <p className="text-sm text-neutral-500">
              {orderDate.date} {orderDate.time}
            </p>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">주문자</dt>
              <dd className="font-medium text-neutral-900">{order.customer_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">연락처</dt>
              <dd className="font-medium text-neutral-900">{order.customer_phone}</dd>
            </div>
            {order.customer_email ? (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">이메일</dt>
                <dd className="font-medium text-neutral-900">{order.customer_email}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">입금자명</dt>
              <dd className="font-medium text-neutral-900">{order.depositor_name ?? order.customer_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">결제상태</dt>
              <dd className="font-medium text-neutral-900">
                {getPaymentStatusLabel(order.payment_status)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">상품</dt>
              <dd className="text-right font-medium text-neutral-900">{summary.productLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">상태</dt>
              <dd className="font-medium text-neutral-900">{getOrderStatusLabel(order.status)}</dd>
            </div>
          </dl>

          {onFulfillmentAction ? (
            <AdminOrderFulfillmentPanel
              order={order}
              isProcessing={isFulfillmentProcessing}
              errorMessage={fulfillmentErrorMessage}
              onAction={onFulfillmentAction}
              onSaveShipping={onSaveShipping}
            />
          ) : null}

          <div className="rounded-xl border border-neutral-200 p-4 text-sm">
            <p className="font-medium text-neutral-900">배송지</p>
            <p className="mt-2 text-neutral-700">
              {recipientName} · {recipientPhone}
            </p>
            <p className="mt-1 leading-relaxed text-neutral-700">
              {order.zipcode ? `(${order.zipcode}) ` : ''}
              {order.address1 ?? ''}
              {order.address2 ? ` ${order.address2}` : ''}
            </p>
            {order.memo ? <p className="mt-2 text-neutral-500">배송메모: {order.memo}</p> : null}
          </div>

          {order.order_items.length > 0 ? (
            <ul className="space-y-2 rounded-xl border border-neutral-200 p-4">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-neutral-900">{item.product_name}</p>
                    <p className="mt-0.5 text-neutral-500">수량 {item.quantity}개</p>
                  </div>
                  <p className="font-semibold text-neutral-900">{formatPrice(item.total_price)}</p>
                </li>
              ))}
            </ul>
          ) : null}

          <dl className="space-y-2 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between gap-4 text-neutral-600">
              <dt>상품 금액</dt>
              <dd className="font-semibold text-neutral-900">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.coupon_discount_amount > 0 ? (
              <div className="flex justify-between gap-4 text-neutral-600">
                <dt>쿠폰 할인</dt>
                <dd className="font-semibold text-red-600">
                  -{formatPrice(order.coupon_discount_amount)}
                </dd>
              </div>
            ) : null}
            <ShippingFeeRow
              subtotal={order.subtotal}
              shippingFee={order.shipping_fee}
            />
            <div className="flex justify-between gap-4 border-t border-neutral-100 pt-3 text-base">
              <dt className="font-semibold text-neutral-900">최종 입금금액</dt>
              <dd className="font-bold text-neutral-900">{formatPrice(order.total_amount)}</dd>
            </div>
          </dl>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
