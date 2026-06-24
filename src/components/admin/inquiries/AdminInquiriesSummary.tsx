import type { AdminInquirySummaryStats } from '../../../types/adminInquiry'

interface AdminInquiriesSummaryProps {
  stats: AdminInquirySummaryStats
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

export function AdminInquiriesSummary({ stats }: AdminInquiriesSummaryProps) {
  return (
    <section
      aria-label="문의 요약"
      className="grid grid-cols-3 gap-2 sm:gap-3"
    >
      <SummaryCard label="전체 문의" value={formatCount(stats.totalCount)} />
      <SummaryCard label="답변대기" value={formatCount(stats.pendingCount)} />
      <SummaryCard label="오늘 문의" value={formatCount(stats.todayCount)} />
    </section>
  )
}
