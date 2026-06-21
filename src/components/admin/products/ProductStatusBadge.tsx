import type { ProductStatus } from '../../../types/status'
import { getProductStatusBadgeClassName, getProductStatusLabel } from '../../../lib/adminProductStatus'

interface ProductStatusBadgeProps {
  status: ProductStatus
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset sm:text-sm ${getProductStatusBadgeClassName(status)}`}
    >
      {getProductStatusLabel(status)}
    </span>
  )
}
