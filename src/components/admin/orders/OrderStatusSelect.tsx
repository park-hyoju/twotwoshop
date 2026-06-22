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
      onClick={(event) => event.stopPropagation()}
      className="w-full max-w-[7.5rem] rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-100"
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
