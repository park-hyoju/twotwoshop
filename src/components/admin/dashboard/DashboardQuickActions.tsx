import { Link } from 'react-router-dom'
import { ADMIN_ROUTES } from '../../../lib/adminRoutes'

const quickActions = [
  { label: '상품 등록', to: ADMIN_ROUTES.products, icon: '➕' },
  { label: '주문 확인', to: ADMIN_ROUTES.orders, icon: '📦' },
  { label: '상품 관리', to: ADMIN_ROUTES.products, icon: '🏷️' },
  { label: '고객 보기', to: ADMIN_ROUTES.customers, icon: '👥' },
] as const

export function DashboardQuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {quickActions.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
        >
          <span aria-hidden="true">{action.icon}</span>
          {action.label}
        </Link>
      ))}
    </div>
  )
}
