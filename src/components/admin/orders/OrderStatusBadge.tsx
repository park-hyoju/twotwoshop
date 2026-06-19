import type { DbOrderStatus } from '../../../types/adminOrder'
import { getOrderStatusBadgeClassName, getOrderStatusLabel } from '../../../lib/adminOrderStatus'

interface OrderStatusBadgeProps {
  status: DbOrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset sm:text-sm ${getOrderStatusBadgeClassName(status)}`}
    >
      {getOrderStatusLabel(status)}
    </span>
  )
}
