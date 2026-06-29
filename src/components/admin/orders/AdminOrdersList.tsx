import { getPaymentStatusLabel } from '../../../lib/adminOrderStatus'
import { formatTrackingDisplay } from '../../../lib/adminOrderFulfillment'
import { formatPrice } from '../../../lib/formatPrice'
import type { AdminOrderRow } from '../../../types/adminOrder'
import { formatAdminOrderDate } from './adminOrderDisplay'
import { OrderStatusBadge } from './OrderStatusBadge'

interface AdminOrdersListProps {
  orders: AdminOrderRow[]
  onDetailClick?: (order: AdminOrderRow) => void
}

export function AdminOrdersList({ orders, onDetailClick }: AdminOrdersListProps) {
  return (
    <>
      <div className="space-y-2 md:hidden">
        {orders.map((order) => (
          <MobileOrderCard key={order.id} order={order} onDetailClick={onDetailClick} />
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 overflow-auto rounded-lg border border-neutral-200 bg-white md:block">
        <table className="min-w-[1200px] w-full table-fixed">
          <thead className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="w-[10rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                주문번호
              </th>
              <th className="w-[5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                주문일
              </th>
              <th className="w-[4.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                주문자
              </th>
              <th className="w-[6.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                연락처
              </th>
              <th className="w-[4.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                입금자명
              </th>
              <th className="w-[6rem] px-3 py-2.5 text-right text-xs font-semibold text-neutral-600">
                최종금액
              </th>
              <th className="w-[4.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                주문상태
              </th>
              <th className="w-[4.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                입금상태
              </th>
              <th className="w-[5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                택배사
              </th>
              <th className="w-[7rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                운송장번호
              </th>
              <th className="w-[4.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                상세
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((order) => {
              const orderDate = formatAdminOrderDate(order.created_at)

              return (
                <tr key={order.id} className="text-sm text-neutral-800">
                  <td className="px-3 py-2.5 font-medium text-neutral-900">{order.order_number}</td>
                  <td className="px-3 py-2.5">
                    <div className="whitespace-nowrap text-xs leading-4 text-neutral-600">
                      <p>{orderDate.date}</p>
                      <p>{orderDate.time}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 truncate">{order.customer_name}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs">{order.customer_phone}</td>
                  <td className="px-3 py-2.5 truncate">
                    {order.depositor_name ?? order.customer_name}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-neutral-900">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-3 py-2.5">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-neutral-700">
                    {getPaymentStatusLabel(order.payment_status)}
                  </td>
                  <td className="px-3 py-2.5 truncate text-xs">{order.courier ?? '-'}</td>
                  <td className="px-3 py-2.5 truncate font-mono text-xs">
                    {order.tracking_number ?? '-'}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => onDetailClick?.(order)}
                      className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                    >
                      상세보기
                    </button>
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

function MobileOrderCard({
  order,
  onDetailClick,
}: {
  order: AdminOrderRow
  onDetailClick?: (order: AdminOrderRow) => void
}) {
  const orderDate = formatAdminOrderDate(order.created_at)

  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-neutral-900">{order.order_number}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {orderDate.date} {orderDate.time}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mt-3 space-y-1 text-sm">
        <Row label="주문자" value={order.customer_name} />
        <Row label="연락처" value={order.customer_phone} />
        <Row label="입금자명" value={order.depositor_name ?? order.customer_name} />
        <Row label="입금상태" value={getPaymentStatusLabel(order.payment_status)} />
        <Row label="택배" value={formatTrackingDisplay(order.courier, order.tracking_number)} />
        <Row label="최종금액" value={formatPrice(order.total_amount)} bold />
      </dl>

      <button
        type="button"
        onClick={() => onDetailClick?.(order)}
        className="mt-3 inline-flex min-h-9 items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
      >
        상세보기
      </button>
    </article>
  )
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className={bold ? 'font-bold text-neutral-900' : 'text-neutral-800'}>{value}</dd>
    </div>
  )
}
