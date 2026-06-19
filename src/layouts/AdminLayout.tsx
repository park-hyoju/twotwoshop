import { NavLink, Outlet } from 'react-router-dom'
import { ADMIN_ROUTES } from '../lib/adminRoutes'
import { ROUTES } from '../lib/routes'

const navItems: Array<{ to: string; label: string; end?: boolean }> = [
  { to: ADMIN_ROUTES.dashboard, label: '대시보드', end: true },
  { to: ADMIN_ROUTES.orders, label: '주문 관리' },
  { to: ADMIN_ROUTES.products, label: '상품 관리' },
  { to: ADMIN_ROUTES.customers, label: '고객 관리' },
  { to: ADMIN_ROUTES.live, label: '라이브 방송' },
  { to: ADMIN_ROUTES.chat, label: '고객 상담' },
  { to: ADMIN_ROUTES.settings, label: '설정' },
]

function getNavLinkClassName(isActive: boolean): string {
  return `block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
    isActive
      ? 'bg-white/15 text-white'
      : 'text-neutral-300 hover:bg-white/10 hover:text-white'
  }`
}

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-100">
      <aside className="flex w-64 shrink-0 flex-col bg-neutral-900 text-white">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-sm font-medium text-neutral-400">TWOTWOSHOP</p>
          <h1 className="mt-1 text-xl font-bold">관리자</h1>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6" aria-label="관리자 메뉴">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => getNavLinkClassName(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <NavLink
            to={ROUTES.home}
            className="block rounded-lg px-4 py-3 text-base font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            ← 쇼핑몰로 돌아가기
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-neutral-200 bg-white px-6 py-4 sm:px-8">
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
            투투샵 관리자
          </h2>
        </header>

        <main className="flex-1 overflow-auto p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
