import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react'
import { formatPrice } from '../../../lib/formatPrice'
import type { AdminOrderRow, DbOrderStatus } from '../../../types/adminOrder'
import { formatAdminOrderDate, getOrderProductSummary } from './adminOrderDisplay'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderStatusSelect } from './OrderStatusSelect'

interface AdminOrdersListProps {
  orders: AdminOrderRow[]
  updatingOrderId: string | null
  onStatusChange: (orderId: string, status: DbOrderStatus) => void
  onOrderNumberClick?: (order: AdminOrderRow) => void
  onCustomerClick?: (order: AdminOrderRow) => void
  onProductClick?: (order: AdminOrderRow, productSlug: string | null) => void
  onRowClick?: (order: AdminOrderRow) => void
}

function stopRowClick(event: MouseEvent | ChangeEvent | KeyboardEvent) {
  event.stopPropagation()
}

const linkButtonClassName =
  'block max-w-full text-left text-inherit transition-colors hover:text-neutral-900 hover:underline'

function MobileOrderCard({
  order,
  updatingOrderId,
  onStatusChange,
  onOrderNumberClick,
  onCustomerClick,
  onProductClick,
  onRowClick,
}: {
  order: AdminOrderRow
  updatingOrderId: string | null
  onStatusChange: (orderId: string, status: DbOrderStatus) => void
  onOrderNumberClick?: (order: AdminOrderRow) => void
  onCustomerClick?: (order: AdminOrderRow) => void
  onProductClick?: (order: AdminOrderRow, productSlug: string | null) => void
  onRowClick?: (order: AdminOrderRow) => void
}) {
  const summary = getOrderProductSummary(order)
  const orderDate = formatAdminOrderDate(order.created_at)

  return (
    <article
      className="cursor-pointer rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
      onClick={() => onRowClick?.(order)}
      onKeyDown={(event) => {
        if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onRowClick(order)
        }
      }}
      role={onRowClick ? 'button' : undefined}
      tabIndex={onRowClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className={`${linkButtonClassName} whitespace-nowrap font-semibold text-neutral-900`}
          onClick={(event) => {
            stopRowClick(event)
            onOrderNumberClick?.(order)
          }}
        >
          {order.order_number}
        </button>
        <OrderStatusBadge status={order.status} />
      </div>

      <button
        type="button"
        className={`${linkButtonClassName} mt-1 text-sm text-neutral-600`}
        onClick={(event) => {
          stopRowClick(event)
          onCustomerClick?.(order)
        }}
      >
        {order.customer_name}
      </button>

      <button
        type="button"
        className={`${linkButtonClassName} mt-2 truncate text-sm text-neutral-700`}
        onClick={(event) => {
          stopRowClick(event)
          onProductClick?.(order, summary.primaryProductSlug)
        }}
      >
        {summary.productLabel}
      </button>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-xs text-neutral-500">
          <p>{orderDate.date}</p>
          <p>{orderDate.time}</p>
        </div>
        <p className="text-sm font-bold text-neutral-900">{formatPrice(order.total_amount)}</p>
      </div>

      <div className="mt-3" onClick={stopRowClick} onKeyDown={stopRowClick}>
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
  onOrderNumberClick,
  onCustomerClick,
  onProductClick,
  onRowClick,
}: AdminOrdersListProps) {
  return (
    <>
      <div className="space-y-2 md:hidden">
        {orders.map((order) => (
          <MobileOrderCard
            key={order.id}
            order={order}
            updatingOrderId={updatingOrderId}
            onStatusChange={onStatusChange}
            onOrderNumberClick={onOrderNumberClick}
            onCustomerClick={onCustomerClick}
            onProductClick={onProductClick}
            onRowClick={onRowClick}
          />
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 overflow-auto rounded-lg border border-neutral-200 bg-white md:block">
        <table className="min-w-[920px] w-full table-fixed">
          <thead className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="w-[12.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                주문번호
              </th>
              <th className="w-[5.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                주문자
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">상품</th>
              <th className="w-[5.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                주문일
              </th>
              <th className="w-[6.5rem] px-3 py-2.5 text-right text-xs font-semibold text-neutral-600">
                총금액
              </th>
              <th className="w-[5.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                상태
              </th>
              <th className="w-[8rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                상태 변경
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((order) => {
              const summary = getOrderProductSummary(order)
              const orderDate = formatAdminOrderDate(order.created_at)

              return (
                <tr
                  key={order.id}
                  className="cursor-pointer text-sm text-neutral-800 transition-colors hover:bg-neutral-50"
                  onClick={() => onRowClick?.(order)}
                >
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className={`${linkButtonClassName} whitespace-nowrap font-medium text-neutral-900`}
                      onClick={(event) => {
                        stopRowClick(event)
                        onOrderNumberClick?.(order)
                      }}
                    >
                      {order.order_number}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className={`${linkButtonClassName} truncate`}
                      onClick={(event) => {
                        stopRowClick(event)
                        onCustomerClick?.(order)
                      }}
                    >
                      {order.customer_name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className={`${linkButtonClassName} truncate`}
                      title={summary.productLabel}
                      onClick={(event) => {
                        stopRowClick(event)
                        onProductClick?.(order, summary.primaryProductSlug)
                      }}
                    >
                      {summary.productLabel}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="whitespace-nowrap text-xs leading-4 text-neutral-600">
                      <p>{orderDate.date}</p>
                      <p>{orderDate.time}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="whitespace-nowrap font-bold text-neutral-900">
                      {formatPrice(order.total_amount)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-2.5" onClick={stopRowClick} onKeyDown={stopRowClick}>
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
