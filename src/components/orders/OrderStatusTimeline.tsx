import {
  getOrderStatusLabel,
  getOrderTimelineIndex,
  ORDER_STATUS_TIMELINE,
  normalizeOrderStatus,
} from '../../lib/adminOrderStatus'
import type { DbOrderStatus } from '../../types/adminOrder'

interface OrderStatusTimelineProps {
  status: DbOrderStatus | string
  className?: string
}

export function OrderStatusTimeline({ status, className = '' }: OrderStatusTimelineProps) {
  const normalized = normalizeOrderStatus(status)
  const activeIndex = getOrderTimelineIndex(status)

  if (normalized === 'cancel_requested' || normalized === 'cancelled') {
    return (
      <div className={className}>
        <p className="text-sm font-medium text-neutral-900">주문 상태</p>
        <p className="mt-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {getOrderStatusLabel(status)}
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="text-sm font-medium text-neutral-900">주문 상태</p>
      <ol className="mt-4 space-y-0">
        {ORDER_STATUS_TIMELINE.map((step, index) => {
          const isCompleted = activeIndex > index
          const isCurrent = activeIndex === index

          return (
            <li key={step} className="relative flex gap-3 pb-6 last:pb-0">
              {index < ORDER_STATUS_TIMELINE.length - 1 ? (
                <span
                  aria-hidden
                  className={`absolute left-[0.6875rem] top-5 h-[calc(100%-0.5rem)] w-px ${
                    isCompleted ? 'bg-neutral-900' : 'bg-neutral-200'
                  }`}
                />
              ) : null}
              <span
                aria-hidden
                className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isCompleted || isCurrent
                    ? 'border-neutral-900 bg-neutral-900'
                    : 'border-neutral-300 bg-white'
                }`}
              >
                {isCompleted ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-sm font-medium ${
                    isCurrent ? 'text-neutral-900' : isCompleted ? 'text-neutral-700' : 'text-neutral-400'
                  }`}
                >
                  {getOrderStatusLabel(step)}
                </p>
                {isCurrent ? (
                  <p className="mt-0.5 text-xs text-neutral-500">현재 단계</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
