import { buildTrackingUrl } from '../../lib/adminOrderFulfillment'
import { getPaymentStatusLabel } from '../../lib/adminOrderStatus'
import type { MemberOrderDetail } from '../../types/mypage'

interface OrderShippingTrackingProps {
  order: MemberOrderDetail
}

export function OrderShippingTracking({ order }: OrderShippingTrackingProps) {
  const trackingUrl =
    order.courier && order.trackingNumber
      ? buildTrackingUrl(order.courier, order.trackingNumber)
      : null

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-neutral-900">배송 조회</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-neutral-500">입금상태</dt>
          <dd className="font-medium text-neutral-900">{getPaymentStatusLabel(order.paymentStatus)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-neutral-500">택배사</dt>
          <dd className="font-medium text-neutral-900">{order.courier ?? '배송 준비 중'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-neutral-500">운송장번호</dt>
          <dd className="font-mono text-sm font-medium text-neutral-900">
            {order.trackingNumber ?? '-'}
          </dd>
        </div>
      </dl>

      {trackingUrl ? (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          배송 조회하기
        </a>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          {order.status === 'pending_payment'
            ? '입금 확인 후 배송 준비가 시작됩니다.'
            : order.status === 'payment_confirmed' || order.status === 'preparing'
              ? '상품 포장 및 출고 준비 중입니다. 송장번호는 출고 후 등록됩니다.'
              : '운송장번호가 등록되면 배송 조회가 가능합니다.'}
        </p>
      )}
    </section>
  )
}
