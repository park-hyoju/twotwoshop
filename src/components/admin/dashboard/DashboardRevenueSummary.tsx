import { formatPrice } from '../../../lib/formatPrice'
import type { AdminDashboardRevenueStats } from '../../../types/adminDashboard'

interface DashboardRevenueSummaryProps {
  revenueStats: AdminDashboardRevenueStats
}

interface SummaryRowProps {
  label: string
  value: string
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 py-3 last:border-b-0">
      <dt className="text-sm text-neutral-600 sm:text-base">{label}</dt>
      <dd className="text-sm font-semibold text-neutral-900 sm:text-base">{value}</dd>
    </div>
  )
}

export function DashboardRevenueSummary({ revenueStats }: DashboardRevenueSummaryProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">보조 매출 요약</h2>
      <p className="mt-1 text-sm text-neutral-500">누적 매출 흐름을 함께 확인합니다.</p>
      <dl className="mt-3">
        <SummaryRow label="오늘 매출" value={formatPrice(revenueStats.todayRevenue)} />
        <SummaryRow label="이번 달 매출" value={formatPrice(revenueStats.monthRevenue)} />
        <SummaryRow label="총 매출" value={formatPrice(revenueStats.totalRevenue)} />
      </dl>
      <p className="mt-4 text-xs text-neutral-500 sm:text-sm">
        취소된 주문은 매출 합계에서 제외됩니다.
      </p>
    </section>
  )
}
