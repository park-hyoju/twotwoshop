import { Link } from 'react-router-dom'
import {
  ADMIN_ORDER_LIST_ROUTES,
  ADMIN_PRODUCT_LIST_ROUTES,
} from '../../../lib/adminDashboardRoutes'
import { ADMIN_ROUTES } from '../../../lib/adminRoutes'
import type { AdminDashboardTaskStats } from '../../../types/adminDashboard'

interface DashboardTodayTasksProps {
  taskStats: AdminDashboardTaskStats
}

interface TaskCardConfig {
  key: string
  label: string
  description: string
  to: string
  count: string
  tone: 'danger' | 'warning' | 'caution' | 'neutral'
  preparing?: boolean
}

const toneStyles = {
  danger: {
    card: 'border-red-200 bg-red-50',
    badge: 'bg-red-100 text-red-800',
    button: 'bg-red-700 hover:bg-red-800 text-white',
  },
  warning: {
    card: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-900',
    button: 'bg-amber-700 hover:bg-amber-800 text-white',
  },
  caution: {
    card: 'border-orange-200 bg-orange-50',
    badge: 'bg-orange-100 text-orange-900',
    button: 'bg-orange-700 hover:bg-orange-800 text-white',
  },
  neutral: {
    card: 'border-neutral-200 bg-neutral-50',
    badge: 'bg-neutral-200 text-neutral-700',
    button: 'bg-neutral-800 hover:bg-neutral-900 text-white',
  },
} as const

function formatTaskCount(value: number): string {
  return value.toLocaleString('ko-KR')
}

export function DashboardTodayTasks({ taskStats }: DashboardTodayTasksProps) {
  const tasks: TaskCardConfig[] = [
    {
      key: 'pending',
      label: '미처리 주문',
      description: '접수 후 아직 처리하지 않은 주문입니다.',
      to: ADMIN_ORDER_LIST_ROUTES.pending,
      count: `${formatTaskCount(taskStats.pendingOrderCount)}건`,
      tone: taskStats.pendingOrderCount > 0 ? 'danger' : 'neutral',
    },
    {
      key: 'shipping',
      label: '배송 준비',
      description: '결제 확인 후 발송 준비가 필요한 주문입니다.',
      to: ADMIN_ORDER_LIST_ROUTES.confirmed,
      count: `${formatTaskCount(taskStats.shippingReadyCount)}건`,
      tone: taskStats.shippingReadyCount > 0 ? 'warning' : 'neutral',
    },
    {
      key: 'soldout',
      label: '품절 상품',
      description: '품절 상태로 전환된 상품을 확인하세요.',
      to: ADMIN_PRODUCT_LIST_ROUTES.soldout,
      count: `${formatTaskCount(taskStats.soldOutProductCount)}개`,
      tone: taskStats.soldOutProductCount > 0 ? 'caution' : 'neutral',
    },
    {
      key: 'inquiry',
      label: '미답변 문의',
      description: '고객 상담 답변이 필요한 문의입니다.',
      to: ADMIN_ROUTES.chat,
      count:
        taskStats.unansweredInquiryCount === null
          ? '준비 중'
          : `${formatTaskCount(taskStats.unansweredInquiryCount)}건`,
      tone:
        taskStats.unansweredInquiryCount !== null && taskStats.unansweredInquiryCount > 0
          ? 'warning'
          : 'neutral',
      preparing: taskStats.unansweredInquiryCount === null,
    },
  ]

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">오늘 해야 할 일</h2>
      <p className="mt-1 text-sm text-neutral-500 sm:text-base">
        지금 바로 확인하고 처리할 항목입니다.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tasks.map((task) => {
          const styles = toneStyles[task.tone]

          return (
            <li
              key={task.key}
              className={`flex h-full flex-col rounded-xl border p-4 ${styles.card}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-900 sm:text-base">{task.label}</p>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${styles.badge}`}
                >
                  {task.count}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm text-neutral-600">{task.description}</p>
              <Link
                to={task.to}
                className={`mt-4 inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${styles.button}`}
              >
                {task.preparing ? '상담 관리 보기' : '바로가기'}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
