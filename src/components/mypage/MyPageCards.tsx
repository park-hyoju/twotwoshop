import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface MyPageMenuCardProps {
  label: string
  description: string
  icon: LucideIcon
  href: string
  badge?: string
}

export function MyPageMenuCard({ label, description, icon: Icon, href, badge }: MyPageMenuCardProps) {
  return (
    <Link
      to={href}
      className="group flex min-h-34 flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 sm:min-h-38 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition-colors group-hover:bg-neutral-900 group-hover:text-white">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        {badge ? (
          <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-white sm:text-xs">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-base font-semibold text-neutral-900">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500 sm:text-sm">{description}</p>
      </div>
    </Link>
  )
}

interface MyPageStatsGridProps {
  orderCount: number
  inquiryCount: number
  addressCount: number
  notificationCount: number
}

export function MyPageStatsGrid({
  orderCount,
  inquiryCount,
  addressCount,
  notificationCount,
}: MyPageStatsGridProps) {
  const items = [
    { label: '주문', value: orderCount },
    { label: '문의', value: inquiryCount },
    { label: '배송지', value: addressCount },
    { label: '알림', value: notificationCount },
  ]

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center"
        >
          <p className="text-lg font-bold text-neutral-900 sm:text-xl">{item.value}</p>
          <p className="mt-0.5 text-xs font-medium text-neutral-500 sm:text-sm">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
