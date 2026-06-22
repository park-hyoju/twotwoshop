import { Link, useNavigate } from 'react-router-dom'
import { OrderStatusBadge } from '../orders/OrderStatusBadge'
import { formatDateTime } from '../../../lib/formatDateTime'
import { formatPrice } from '../../../lib/formatPrice'
import { ADMIN_ROUTES } from '../../../lib/adminRoutes'
import type { AdminDashboardRecentOrder } from '../../../types/adminDashboard'

interface DashboardRecentOrdersProps {
  orders: AdminDashboardRecentOrder[]
}

export function DashboardRecentOrders({ orders }: DashboardRecentOrdersProps) {
  const navigate = useNavigate()

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">최근 주문</h2>
        <Link
          to={ADMIN_ROUTES.orders}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
        >
          전체 주문 보기
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-xl bg-neutral-50 px-4 py-10 text-center">
          <p className="text-base font-medium text-neutral-700 sm:text-lg">
            아직 접수된 주문이 없습니다.
          </p>
          <p className="mt-2 text-sm text-neutral-500 sm:text-base">
            주문이 들어오면 이곳에서 바로 확인할 수 있습니다.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr className="text-left text-sm font-semibold text-neutral-700">
                  <th className="px-3 py-3">주문번호</th>
                  <th className="px-3 py-3">주문자</th>
                  <th className="px-3 py-3">금액</th>
                  <th className="px-3 py-3">상태</th>
                  <th className="px-3 py-3">주문일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm text-neutral-800">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50"
                    onClick={() => navigate(ADMIN_ROUTES.orders)}
                  >
                    <td className="px-3 py-3 font-medium text-neutral-900">
                      {order.order_number}
                    </td>
                    <td className="px-3 py-3">{order.customer_name}</td>
                    <td className="px-3 py-3 font-semibold">{formatPrice(order.total_amount)}</td>
                    <td className="px-3 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatDateTime(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-3 md:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => navigate(ADMIN_ROUTES.orders)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-left transition-colors hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-900">{order.order_number}</p>
                      <p className="mt-1 text-sm text-neutral-600">{order.customer_name}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-neutral-900">
                      {formatPrice(order.total_amount)}
                    </span>
                    <span className="text-neutral-500">{formatDateTime(order.created_at)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
