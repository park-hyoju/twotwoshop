import type { DbOrderStatus } from '../../../types/adminOrder'
import { getOrderStatusBadgeClassName, getOrderStatusLabel } from '../../../lib/adminOrderStatus'

interface OrderStatusBadgeProps {
  status: DbOrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ring-1 ring-inset sm:text-xs ${getOrderStatusBadgeClassName(status)} ${className}`}
    >
      {getOrderStatusLabel(status)}
    </span>
  )
}
