import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Copy, CheckCircle2 } from 'lucide-react'
import { DepositAccountInfo } from '../../components/deposit/DepositAccountInfo'
import { ShippingFeeRow } from '../../components/orders/ShippingFeeRow'
import { formatPrice } from '../../lib/formatPrice'
import { isValidOrder } from '../../lib/orderStorage'
import { ROUTES } from '../../lib/routes'
import { orderRepository } from '../../services/orderRepository'
import type { Order } from '../../types/order'

function resolveOrder(state: unknown): { order: Order | null; isMember: boolean } {
  const locationState = state as { order?: unknown; isMember?: boolean } | null
  const stateOrder = locationState?.order

  if (isValidOrder(stateOrder)) {
    return {
      order: stateOrder,
      isMember: locationState?.isMember === true || stateOrder.isMember,
    }
  }

  const latest = orderRepository.getLatestOrder()
  return {
    order: latest,
    isMember: latest?.isMember ?? false,
  }
}

export function OrderCompletePage() {
  const location = useLocation()
  const [resolved, setResolved] = useState(() => resolveOrder(location.state))
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  useEffect(() => {
    setResolved(resolveOrder(location.state))
  }, [location.key, location.state])

  const { order, isMember } = resolved

  async function handleCopy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyMessage(message)
    } catch {
      setCopyMessage('복사에 실패했습니다.')
    }
    window.setTimeout(() => setCopyMessage(null), 2000)
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center sm:p-8">
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            최근 주문 내역이 없습니다.
          </h1>
          <Link
            to={ROUTES.products}
            className="mt-8 inline-flex min-h-14 items-center justify-center rounded-xl bg-neutral-900 px-8 text-lg font-semibold text-white hover:bg-neutral-700"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">주문이 접수되었습니다.</h1>
            <p className="mt-3 text-lg text-neutral-600">
              아래 계좌로 입금해주시면 확인 후 배송이 시작됩니다.
            </p>
          </div>
        </div>

        <dl className="mt-8 space-y-4 rounded-2xl bg-neutral-50 p-5 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <dt className="font-semibold text-neutral-600">주문번호</dt>
            <dd className="font-mono text-lg font-bold text-neutral-900">{order.orderNumber}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <dt className="font-semibold text-neutral-600">상품금액</dt>
            <dd className="text-lg font-semibold text-neutral-900">{formatPrice(order.productTotal)}</dd>
          </div>
          {order.couponDiscount > 0 ? (
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="font-semibold text-neutral-600">쿠폰 할인</dt>
              <dd className="text-lg font-semibold text-red-600">-{formatPrice(order.couponDiscount)}</dd>
            </div>
          ) : null}
          <ShippingFeeRow
            subtotal={order.productTotal}
            shippingFee={order.shippingFee}
            hintClassName="text-sm text-neutral-500"
          />
          <div className="flex flex-col gap-1 border-t border-neutral-200 pt-4 sm:flex-row sm:justify-between">
            <dt className="font-semibold text-neutral-600">최종 입금금액</dt>
            <dd className="text-2xl font-bold text-neutral-900">{formatPrice(order.totalAmount)}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <dt className="font-semibold text-neutral-600">입금자명</dt>
            <dd className="text-lg font-semibold text-neutral-900">{order.depositorName}</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-2xl border border-neutral-200 p-5 sm:p-6">
          <DepositAccountInfo title="입금 계좌" description="" showCopyButton />
        </div>

        {copyMessage ? (
          <p role="status" className="mt-4 text-center text-sm text-neutral-600">
            {copyMessage}
          </p>
        ) : null}

        {isMember ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-900">
              마이페이지에서 주문내역을 확인할 수 있습니다.
            </p>
            <Link
              to={ROUTES.mypageOrders}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              주문내역 보러가기
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-900">주문번호를 저장해주세요.</p>
            <p className="mt-2 text-sm text-amber-800">
              비회원 주문은 주문번호로 조회할 수 있습니다. 고객센터 또는 1:1 문의를 이용해주세요.
            </p>
            <button
              type="button"
              onClick={() => void handleCopy(order.orderNumber, '주문번호가 복사되었습니다.')}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              <Copy className="h-4 w-4" aria-hidden />
              주문번호 복사
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to={ROUTES.home}
            className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-neutral-900 py-4 text-lg font-semibold text-white hover:bg-neutral-700"
          >
            홈으로
          </Link>
          <Link
            to={ROUTES.products}
            className="flex min-h-14 flex-1 items-center justify-center rounded-xl border border-neutral-300 bg-white py-4 text-lg font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  )
}
