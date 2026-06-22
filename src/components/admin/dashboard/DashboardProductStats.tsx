import type { AdminDashboardProductStats } from '../../../types/adminDashboard'

interface DashboardProductStatsProps {
  productStats: AdminDashboardProductStats
}

interface SummaryRowProps {
  label: string
  value: string
  valueClassName?: string
}

function SummaryRow({ label, value, valueClassName = 'text-neutral-900' }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 py-3 last:border-b-0">
      <dt className="text-sm text-neutral-600 sm:text-base">{label}</dt>
      <dd className={`text-sm font-semibold sm:text-base ${valueClassName}`}>{value}</dd>
    </div>
  )
}

function formatCount(value: number): string {
  return value.toLocaleString('ko-KR')
}

export function DashboardProductStats({ productStats }: DashboardProductStatsProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">상품 현황</h2>
      <dl className="mt-2">
        <SummaryRow
          label="판매중"
          value={`${formatCount(productStats.activeCount)}개`}
          valueClassName="text-emerald-700"
        />
        <SummaryRow
          label="품절"
          value={`${formatCount(productStats.soldOutCount)}개`}
          valueClassName="text-amber-700"
        />
        <SummaryRow
          label="숨김"
          value={`${formatCount(productStats.hiddenCount)}개`}
          valueClassName="text-neutral-700"
        />
      </dl>
    </section>
  )
}
