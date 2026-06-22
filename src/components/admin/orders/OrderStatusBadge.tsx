import type { DbOrderStatus } from '../../../types/adminOrder'
import { getOrderStatusBadgeClassName, getOrderStatusLabel } from '../../../lib/adminOrderStatus'

interface OrderStatusBadgeProps {
  status: DbOrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-none ring-1 ring-inset sm:text-sm ${getOrderStatusBadgeClassName(status)} ${className}`}
    >
      {getOrderStatusLabel(status)}
    </span>
  )
}
