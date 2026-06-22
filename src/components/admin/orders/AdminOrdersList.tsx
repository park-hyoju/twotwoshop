import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react'
import { formatDateTime } from '../../../lib/formatDateTime'
import { formatPrice } from '../../../lib/formatPrice'
import type { AdminOrderRow, DbOrderStatus } from '../../../types/adminOrder'
import { getOrderProductSummary } from './adminOrderDisplay'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderStatusSelect } from './OrderStatusSelect'

interface AdminOrdersListProps {
  orders: AdminOrderRow[]
  updatingOrderId: string | null
  onStatusChange: (orderId: string, status: DbOrderStatus) => void
  onOrderClick?: (order: AdminOrderRow) => void
}

function stopRowClick(event: MouseEvent | ChangeEvent | KeyboardEvent) {
  event.stopPropagation()
}

function MobileOrderCard({
  order,
  updatingOrderId,
  onStatusChange,
  onOrderClick,
}: {
  order: AdminOrderRow
  updatingOrderId: string | null
  onStatusChange: (orderId: string, status: DbOrderStatus) => void
  onOrderClick?: (order: AdminOrderRow) => void
}) {
  const summary = getOrderProductSummary(order)

  return (
    <article
      className={`rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors ${
        onOrderClick ? 'cursor-pointer hover:border-neutral-300 hover:bg-neutral-50' : ''
      }`}
      onClick={() => onOrderClick?.(order)}
      onKeyDown={(event) => {
        if (onOrderClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onOrderClick(order)
        }
      }}
      role={onOrderClick ? 'button' : undefined}
      tabIndex={onOrderClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">{order.order_number}</p>
          <p className="mt-1 text-sm text-neutral-600">{order.customer_name}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <p className="truncate text-neutral-700">{summary.productLabel}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-neutral-900">{formatPrice(order.total_amount)}</span>
          <span className="shrink-0 text-neutral-500">{formatDateTime(order.created_at)}</span>
        </div>
        <p className="text-neutral-500">{order.customer_phone}</p>
      </div>

      <div className="mt-4" onClick={stopRowClick} onKeyDown={stopRowClick}>
        <label className="mb-1.5 block text-xs font-medium text-neutral-600">주문 상태 변경</label>
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
  onOrderClick,
}: AdminOrdersListProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {orders.map((order) => (
          <MobileOrderCard
            key={order.id}
            order={order}
            updatingOrderId={updatingOrderId}
            onStatusChange={onStatusChange}
            onOrderClick={onOrderClick}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white md:block">
        <table className="min-w-[960px] w-full table-fixed divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="w-[11rem] px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                주문번호
              </th>
              <th className="w-[6rem] px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                주문자
              </th>
              <th className="w-[7.5rem] px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                연락처
              </th>
              <th className="w-[9.5rem] px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                주문일
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">상품명</th>
              <th className="w-[5.5rem] px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                총금액
              </th>
              <th className="w-[7rem] px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                상태
              </th>
              <th className="w-[9.5rem] px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                변경
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((order) => {
              const summary = getOrderProductSummary(order)

              return (
                <tr
                  key={order.id}
                  className={`text-sm text-neutral-800 transition-colors ${
                    onOrderClick ? 'cursor-pointer hover:bg-neutral-50' : 'hover:bg-neutral-50/70'
                  }`}
                  onClick={() => onOrderClick?.(order)}
                >
                  <td className="px-4 py-3">
                    <span className="block truncate font-medium text-neutral-900">
                      {order.order_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block truncate">{order.customer_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block whitespace-nowrap">{order.customer_phone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block whitespace-nowrap text-neutral-600">
                      {formatDateTime(order.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block truncate" title={summary.productLabel}>
                      {summary.productLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block whitespace-nowrap font-semibold text-neutral-900">
                      {formatPrice(order.total_amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3" onClick={stopRowClick} onKeyDown={stopRowClick}>
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
