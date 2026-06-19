import { ORDER_STATUS_OPTIONS } from '../../../lib/adminOrderStatus'
import type { DbOrderStatus } from '../../../types/adminOrder'

interface OrderStatusSelectProps {
  value: DbOrderStatus
  disabled?: boolean
  onChange: (status: DbOrderStatus) => void
}

export function OrderStatusSelect({
  value,
  disabled = false,
  onChange,
}: OrderStatusSelectProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as DbOrderStatus)}
      className="w-full min-w-[8.5rem] rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-100 sm:text-base"
      aria-label="주문 상태 변경"
    >
      {ORDER_STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
