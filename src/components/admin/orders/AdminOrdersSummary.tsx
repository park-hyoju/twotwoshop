import type { AdminOrderSummaryStats } from '../../../types/adminOrder'

interface AdminOrdersSummaryProps {
  stats: AdminOrderSummaryStats
}

interface SummaryCardProps {
  label: string
  value: string
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-neutral-900">{value}</p>
    </div>
  )
}

function formatCount(value: number): string {
  return `${value.toLocaleString('ko-KR')}건`
}

export function AdminOrdersSummary({ stats }: AdminOrdersSummaryProps) {
  return (
    <section
      aria-label="주문 요약"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
    >
      <SummaryCard label="오늘 주문" value={formatCount(stats.todayOrderCount)} />
      <SummaryCard label="미처리" value={formatCount(stats.pendingOrderCount)} />
      <SummaryCard label="배송중" value={formatCount(stats.shippedOrderCount)} />
      <SummaryCard label="배송완료" value={formatCount(stats.completedOrderCount)} />
    </section>
  )
}
