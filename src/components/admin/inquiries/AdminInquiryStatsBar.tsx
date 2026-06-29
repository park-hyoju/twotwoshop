import type { AdminInquirySummaryStats } from '../../../types/adminInquiry'

interface AdminInquiryStatsBarProps {
  stats: AdminInquirySummaryStats
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'orange' | 'emerald' | 'violet' | 'slate'
}) {
  const toneClasses = {
    orange: 'bg-orange-50 text-orange-700 ring-orange-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }[tone]

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${toneClasses}`}
    >
      <span className="text-[11px] font-medium opacity-80">{label}</span>
      <span>{value.toLocaleString('ko-KR')}</span>
    </div>
  )
}

export function AdminInquiryStatsBar({ stats }: AdminInquiryStatsBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatPill label="답변대기" value={stats.pendingCount} tone="orange" />
      <StatPill label="답변완료" value={stats.answeredCount} tone="emerald" />
      <StatPill label="미확인" value={stats.unreadCount} tone="violet" />
      <StatPill label="오늘" value={stats.todayCount} tone="slate" />
    </div>
  )
}
