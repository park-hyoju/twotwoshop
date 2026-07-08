import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AdminToastProvider, useAdminToast } from '../components/admin/AdminToast'
import { AdminAuthLoading } from '../components/admin/AdminAuthLoading'
import { useAdminAuth } from '../contexts/AdminAuthProvider'
import { AdminInquiryRealtimeProvider, useAdminInquiryRealtime } from '../contexts/AdminInquiryRealtimeContext'
import { AdminInquirySoundProvider } from '../contexts/AdminInquirySoundContext'
import { useAdminInquiryTabTitleReset } from '../hooks/useAdminInquiryRealtimeHub'
import { ADMIN_ROUTES } from '../lib/adminRoutes'
import { ROUTES } from '../lib/routes'

interface AdminNavItem {
  to: string
  label: string
  icon: string
  end?: boolean
  disabled?: boolean
}

const navItems: AdminNavItem[] = [
  { to: ADMIN_ROUTES.dashboard, label: '대시보드', icon: '📊', end: true },
  { to: ADMIN_ROUTES.orders, label: '주문관리', icon: '📦' },
  { to: ADMIN_ROUTES.products, label: '상품관리', icon: '🏷️' },
  { to: ADMIN_ROUTES.banners, label: '배너관리', icon: '📢' },
  { to: ADMIN_ROUTES.notices, label: '공지관리', icon: '📋' },
  { to: ADMIN_ROUTES.restockNotifications, label: '재입고 알림', icon: '🔔' },
  { to: ADMIN_ROUTES.customers, label: '고객관리', icon: '👥' },
  { to: ADMIN_ROUTES.chat, label: '상담관리', icon: '💬' },
  { to: ADMIN_ROUTES.live, label: '라이브 준비중', icon: '📺', disabled: true },
  { to: ADMIN_ROUTES.settings, label: '설정', icon: '⚙️' },
]

function getNavLinkClassName(isActive: boolean, disabled?: boolean): string {
  if (disabled) {
    return 'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-neutral-500 cursor-not-allowed'
  }

  return `flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
    isActive
      ? 'bg-white/15 text-white'
      : 'text-neutral-300 hover:bg-white/10 hover:text-white'
  }`
}

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    )
  }

  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

interface AdminSidebarProps {
  onNavigate?: () => void
  chatUnreadCount: number
}

function AdminSidebar({ onNavigate, chatUnreadCount }: AdminSidebarProps) {
  return (
    <>
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-sm font-medium text-neutral-400">TWOTWOSHOP</p>
        <h1 className="mt-1 text-xl font-bold">관리자</h1>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6" aria-label="관리자 메뉴">
        {navItems.map((item) => {
          const showUnreadBadge = item.to === ADMIN_ROUTES.chat && chatUnreadCount > 0

          if (item.disabled) {
            return (
              <div key={item.to} className={getNavLinkClassName(false, true)} aria-disabled="true">
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </div>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => getNavLinkClassName(isActive)}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {showUnreadBadge && (
                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}

function AdminLayoutShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, authStatus } = useAdminAuth()
  const { unreadCount } = useAdminInquiryRealtime()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  useAdminInquiryTabTitleReset(location.pathname.startsWith(ADMIN_ROUTES.chat))

  if (authStatus !== 'authenticated') {
    return <AdminAuthLoading />
  }

  const currentPageLabel =
    navItems.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    )?.label ?? '관리자'

  async function handleSignOut() {
    setSignOutError(null)
    setIsSigningOut(true)

    try {
      await signOut()
      navigate(ADMIN_ROUTES.login, { replace: true })
    } catch {
      setSignOutError('로그아웃에 실패했습니다.')
    } finally {
      setIsSigningOut(false)
    }
  }

  function closeSidebar() {
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-neutral-100 lg:flex">
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="메뉴 닫기"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-neutral-900 text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar onNavigate={closeSidebar} chatUnreadCount={unreadCount} />

        <div className="space-y-1 border-t border-white/10 px-4 py-4">
          <NavLink
            to={ROUTES.home}
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span aria-hidden="true">🏠</span>
            쇼핑몰로 돌아가기
          </NavLink>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-base font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <span aria-hidden="true">🚪</span>
            {isSigningOut ? '로그아웃 중...' : '로그아웃'}
          </button>
          {signOutError && (
            <p className="px-4 text-sm text-red-300" role="alert">
              {signOutError}
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 lg:hidden"
              aria-label={isSidebarOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen((current) => !current)}
            >
              <MenuIcon isOpen={isSidebarOpen} />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">{currentPageLabel}</h2>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function AdminLayoutRealtimeRoot() {
  const { showToast } = useAdminToast()
  const { authStatus } = useAdminAuth()

  return (
    <AdminInquiryRealtimeProvider
      enabled={authStatus === 'authenticated'}
      onNotify={(message) => showToast(message, { durationMs: 5000 })}
    >
      <AdminLayoutShell />
    </AdminInquiryRealtimeProvider>
  )
}

export function AdminLayout() {
  return (
    <AdminToastProvider>
      <AdminInquirySoundProvider>
        <AdminLayoutRealtimeRoot />
      </AdminInquirySoundProvider>
    </AdminToastProvider>
  )
}
