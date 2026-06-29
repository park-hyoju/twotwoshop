import type { AdminInquirySummaryStats } from '../../../types/adminInquiry'

interface AdminInquiriesSummaryProps {
  stats: AdminInquirySummaryStats
}

interface SummaryCardProps {
  label: string
  value: string
  icon: string
  gradient: string
  highlight?: boolean
}

function SummaryCard({ label, value, icon, gradient, highlight = false }: SummaryCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-transform hover:-translate-y-0.5 ${
        highlight ? 'border-orange-200/80' : 'border-white/60'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg backdrop-blur-sm">
          {icon}
        </span>
      </div>
    </div>
  )
}

function formatCount(value: number): string {
  return `${value.toLocaleString('ko-KR')}건`
}

export function AdminInquiriesSummary({ stats }: AdminInquiriesSummaryProps) {
  return (
    <section aria-label="문의 요약" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryCard
        label="답변대기"
        value={formatCount(stats.pendingCount)}
        icon="⏳"
        gradient="from-orange-500 to-amber-400"
        highlight={stats.pendingCount > 0}
      />
      <SummaryCard
        label="답변완료"
        value={formatCount(stats.answeredCount)}
        icon="✅"
        gradient="from-emerald-500 to-teal-400"
      />
      <SummaryCard
        label="미확인"
        value={formatCount(stats.unreadCount)}
        icon="🔔"
        gradient="from-violet-500 to-fuchsia-400"
        highlight={stats.unreadCount > 0}
      />
      <SummaryCard
        label="오늘 문의"
        value={formatCount(stats.todayCount)}
        icon="📅"
        gradient="from-slate-700 to-slate-500"
      />
    </section>
  )
}
