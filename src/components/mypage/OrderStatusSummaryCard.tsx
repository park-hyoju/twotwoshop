import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { MEMBER_ORDER_STATUS_SUMMARY_ITEMS } from '../../lib/memberOrderStatusSummary'
import { ROUTES } from '../../lib/routes'
import type { MemberOrderStatusSummary } from '../../types/mypage'

interface OrderStatusSummaryCardProps {
  summary: MemberOrderStatusSummary
}

export function OrderStatusSummaryCard({ summary }: OrderStatusSummaryCardProps) {
  return (
    <section
      aria-label="주문 상태 요약"
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
            <Package className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">주문 상태</h2>
            <p className="mt-1 text-sm text-neutral-500">현재 주문 진행 현황입니다.</p>
          </div>
        </div>
        <Link
          to={ROUTES.mypageOrders}
          className="shrink-0 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
        >
          전체 보기
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MEMBER_ORDER_STATUS_SUMMARY_ITEMS.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center"
          >
            <p className="text-lg font-bold text-neutral-900 sm:text-xl">{summary[item.key]}</p>
            <p className="mt-0.5 text-xs font-medium text-neutral-500 sm:text-sm">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
