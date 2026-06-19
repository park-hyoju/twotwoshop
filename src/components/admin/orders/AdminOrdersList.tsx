import { formatDateTime } from '../../../lib/formatDateTime'
import { formatPrice } from '../../../lib/formatPrice'
import { summarizeOrderItems } from '../../../services/adminOrderRepository'
import type { AdminOrderRow, DbOrderStatus } from '../../../types/adminOrder'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderStatusSelect } from './OrderStatusSelect'

interface AdminOrdersListProps {
  orders: AdminOrderRow[]
  updatingOrderId: string | null
  onStatusChange: (orderId: string, status: DbOrderStatus) => void
}

function MobileOrderCard({
  order,
  updatingOrderId,
  onStatusChange,
}: {
  order: AdminOrderRow
  updatingOrderId: string | null
  onStatusChange: (orderId: string, status: DbOrderStatus) => void
}) {
  const summary = summarizeOrderItems(order.order_items)

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{order.order_number}</p>
          <p className="mt-1 text-sm text-neutral-600">{formatDateTime(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mt-4 space-y-2 text-sm text-neutral-700 sm:text-base">
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">주문자</dt>
          <dd className="text-right font-medium text-neutral-900">{order.customer_name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">연락처</dt>
          <dd className="text-right">{order.customer_phone}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">상품</dt>
          <dd className="text-right">{summary.productLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">수량</dt>
          <dd className="text-right">{summary.quantityLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">총금액</dt>
          <dd className="text-right font-semibold text-neutral-900">
            {formatPrice(order.total_amount)}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-neutral-700">주문 상태</label>
        <OrderStatusSelect
          value={order.status}
          disabled={updatingOrderId === order.id}
          onChange={(status) => onStatusChange(order.id, status)}
        />
      </div>
    </article>
  )
}

export function AdminOrdersList({
  orders,
  updatingOrderId,
  onStatusChange,
}: AdminOrdersListProps) {
  return (
    <>
      <div className="space-y-4 md:hidden">
        {orders.map((order) => (
          <MobileOrderCard
            key={order.id}
            order={order}
            updatingOrderId={updatingOrderId}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white md:block">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">주문번호</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">주문자</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">연락처</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">주문일</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">상품명</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">수량</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">총금액</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">상태</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">변경</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {orders.map((order) => {
              const summary = summarizeOrderItems(order.order_items)

              return (
                <tr key={order.id} className="text-sm text-neutral-800">
                  <td className="px-4 py-3 font-medium text-neutral-900">{order.order_number}</td>
                  <td className="px-4 py-3">{order.customer_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{order.customer_phone}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(order.created_at)}</td>
                  <td className="px-4 py-3">{summary.productLabel}</td>
                  <td className="px-4 py-3">{summary.quantityLabel}</td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusSelect
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onChange={(status) => onStatusChange(order.id, status)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
