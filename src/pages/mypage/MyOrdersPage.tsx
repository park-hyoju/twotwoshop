import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { MyPageEmptyState } from '../../components/mypage/MyPageEmptyState'
import { MyPageShell } from '../../components/mypage/MyPageShell'
import { getOrderStatusBadgeClassName, getOrderStatusLabel } from '../../lib/adminOrderStatus'
import { formatDateTime } from '../../lib/formatDateTime'
import { formatPrice } from '../../lib/formatPrice'
import { ROUTES } from '../../lib/routes'
import {
  CustomerOrderRepositoryError,
  fetchMemberOrders,
} from '../../services/customerOrderRepository'
import type { MemberOrderSummary } from '../../types/mypage'

function mypageOrderDetailPath(orderId: string): string {
  return `${ROUTES.mypageOrders}/${orderId}`
}

export function MyOrdersPage() {
  const [orders, setOrders] = useState<MemberOrderSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOrders() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextOrders = await fetchMemberOrders()
        if (!cancelled) {
          setOrders(nextOrders)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof CustomerOrderRepositoryError
              ? error.message
              : '주문 내역을 불러오지 못했습니다.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadOrders()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <MyPageShell title="주문내역" description="주문 및 배송 현황을 확인할 수 있습니다.">
      {isLoading ? (
        <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-500 shadow-sm">
          주문 내역을 불러오는 중...
        </p>
      ) : errorMessage ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : orders.length === 0 ? (
        <MyPageEmptyState
          title="아직 주문 내역이 없습니다."
          description=""
          actionLabel="쇼핑 계속하기"
          actionHref={ROUTES.products}
          icon={<Package className="h-6 w-6" aria-hidden />}
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-500">주문번호 {order.orderNumber}</p>
                  <p className="mt-2 text-sm text-neutral-500">{formatDateTime(order.createdAt)}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${getOrderStatusBadgeClassName(order.status)}`}
                >
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-neutral-100 pt-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-neutral-500">입금자명</p>
                    <p className="mt-1 font-medium text-neutral-900">{order.depositorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">결제금액</p>
                    <p className="mt-1 text-xl font-bold text-neutral-900">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
                <Link
                  to={mypageOrderDetailPath(order.id)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                >
                  주문 상세 보기
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </MyPageShell>
  )
}
