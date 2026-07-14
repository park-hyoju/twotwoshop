import { useEffect, useState } from 'react'
import {
  Bell,
  Clock3,
  MapPin,
  MessageSquareText,
  Package,
  UserRoundPen,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DefaultAddressPreview } from '../../components/mypage/DefaultAddressPreview'
import { DepositAccountCard } from '../../components/mypage/DepositAccountCard'
import { OrderStatusSummaryCard } from '../../components/mypage/OrderStatusSummaryCard'
import { MyPageMenuCard, MyPageStatsGrid } from '../../components/mypage/MyPageCards'
import {
  getCustomerAuthErrorMessage,
  useCustomerAuth,
} from '../../contexts/CustomerAuthProvider'
import { isVirtualCustomerAuthEmail } from '../../lib/customerAuthConfig'
import { summarizeMemberOrderStatuses } from '../../lib/memberOrderStatusSummary'
import { getRecentProducts } from '../../lib/recentProducts'
import { ROUTES } from '../../lib/routes'
import { fetchDefaultCustomerAddress } from '../../services/customerAddressRepository'
import { fetchMemberOrders } from '../../services/customerOrderRepository'
import { fetchMypageNotifications, fetchMypageStats } from '../../services/mypageNotificationService'
import type { CustomerAddress, MemberOrderStatusSummary, MypageStats } from '../../types/mypage'

const DEFAULT_STATS: MypageStats = {
  orderCount: 0,
  inquiryCount: 0,
  addressCount: 0,
  notificationCount: 0,
}

const DEFAULT_ORDER_STATUS_SUMMARY: MemberOrderStatusSummary = {
  waitingPayment: 0,
  preparing: 0,
  shipping: 0,
  completed: 0,
}

function resolveDisplayEmail(
  optionalEmail: string | null | undefined,
  profileEmail: string | null | undefined,
): string | null {
  const candidates = [optionalEmail, profileEmail]
  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (!trimmed) {
      continue
    }
    if (isVirtualCustomerAuthEmail(trimmed)) {
      continue
    }
    return trimmed
  }
  return null
}

export function MyPage() {
  const navigate = useNavigate()
  const { displayName, profile, username, signOut } = useCustomerAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [stats, setStats] = useState<MypageStats>(DEFAULT_STATS)
  const [recentCount, setRecentCount] = useState(0)
  const [defaultAddress, setDefaultAddress] = useState<CustomerAddress | null>(null)
  const [orderStatusSummary, setOrderStatusSummary] = useState<MemberOrderStatusSummary>(
    DEFAULT_ORDER_STATUS_SUMMARY,
  )

  const nameLabel = displayName?.trim() || profile?.name?.trim() || '회원'
  const loginId = profile?.loginId?.trim() || username?.trim() || null
  const phone = profile?.phone?.trim() || null
  const displayEmail = resolveDisplayEmail(profile?.optionalEmail, profile?.email)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        const [nextStats, notifications, orders, addresses] = await Promise.all([
          fetchMypageStats(),
          fetchMypageNotifications(),
          fetchMemberOrders().catch(() => []),
          fetchDefaultCustomerAddress().catch(() => null),
        ])

        if (!cancelled) {
          setStats({
            ...nextStats,
            notificationCount: notifications.filter((item) => item.isUnread).length,
          })
          setRecentCount(getRecentProducts().length)
          setOrderStatusSummary(summarizeMemberOrderStatuses(orders))
          setDefaultAddress(addresses)
        }
      } catch {
        if (!cancelled) {
          setStats(DEFAULT_STATS)
          setRecentCount(getRecentProducts().length)
          setOrderStatusSummary(DEFAULT_ORDER_STATUS_SUMMARY)
          setDefaultAddress(null)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSignOut() {
    setErrorMessage(null)
    setIsSigningOut(true)

    try {
      await signOut()
      navigate(ROUTES.signin, { replace: true })
    } catch (error) {
      setErrorMessage(getCustomerAuthErrorMessage(error))
    } finally {
      setIsSigningOut(false)
    }
  }

  const menuItems = [
    {
      id: 'orders',
      label: '주문내역',
      description: '주문·배송 현황을 확인합니다',
      icon: Package,
      href: ROUTES.mypageOrders,
    },
    {
      id: 'addresses',
      label: '배송지 관리',
      description: '자주 쓰는 배송지를 관리합니다',
      icon: MapPin,
      href: ROUTES.mypageAddresses,
    },
    {
      id: 'inquiries',
      label: '문의내역',
      description: '1:1 문의 내역을 확인합니다',
      icon: MessageSquareText,
      href: ROUTES.mypageInquiries,
      badge: stats.inquiryCount > 0 ? String(stats.inquiryCount) : undefined,
    },
    {
      id: 'profile-edit',
      label: '회원정보 수정',
      description: '연락처·비밀번호를 변경합니다',
      icon: UserRoundPen,
      href: ROUTES.mypageProfile,
    },
    {
      id: 'notifications',
      label: '알림센터',
      description: '재입고·답변·공지 알림을 확인합니다',
      icon: Bell,
      href: ROUTES.mypageNotifications,
      badge: stats.notificationCount > 0 ? String(stats.notificationCount) : undefined,
    },
    {
      id: 'recent',
      label: '최근 본 상품',
      description: '최근 확인한 상품을 다시 봅니다',
      icon: Clock3,
      href: ROUTES.mypageRecent,
      badge: recentCount > 0 ? String(recentCount) : undefined,
    },
  ]

  return (
    <div className="bg-neutral-50 pb-16 pt-10 sm:pb-20 sm:pt-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <p className="text-sm font-medium text-neutral-500">마이페이지</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            나의 쇼핑 정보
          </h1>
        </header>

        <section
          aria-label="회원 프로필"
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-start gap-4 sm:gap-5">
            <span
              aria-hidden
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white sm:h-16 sm:w-16 sm:text-xl"
            >
              {nameLabel.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-bold text-neutral-900 sm:text-2xl">{nameLabel}</p>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-xs font-medium text-neutral-500 sm:text-sm">아이디</dt>
                  <dd className="mt-0.5">
                    <span className="inline-flex rounded-lg bg-neutral-100 px-2.5 py-1 font-mono text-xs tracking-wide text-neutral-700 sm:text-sm">
                      {loginId ?? '-'}
                    </span>
                  </dd>
                </div>
                {phone ? (
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 sm:text-sm">전화번호</dt>
                    <dd className="mt-0.5 truncate text-sm text-neutral-800 sm:text-base">{phone}</dd>
                  </div>
                ) : null}
                {displayEmail ? (
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 sm:text-sm">이메일</dt>
                    <dd className="mt-0.5 truncate text-sm text-neutral-800 sm:text-base">
                      {displayEmail}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>

          <MyPageStatsGrid
            orderCount={stats.orderCount}
            inquiryCount={stats.inquiryCount}
            addressCount={stats.addressCount}
            notificationCount={stats.notificationCount}
          />
        </section>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <DepositAccountCard />
            <DefaultAddressPreview address={defaultAddress} />
          </div>
          <OrderStatusSummaryCard summary={orderStatusSummary} />
        </div>

        <section aria-label="마이페이지 메뉴" className="mt-8 sm:mt-10">
          <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">메뉴</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {menuItems.map((item) => (
              <MyPageMenuCard
                key={item.id}
                label={item.label}
                description={item.description}
                icon={item.icon}
                href={item.href}
                badge={item.badge}
              />
            ))}
          </div>
        </section>

        <div className="mt-10 sm:mt-12">
          {errorMessage ? (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="w-full rounded-2xl border border-neutral-300 bg-white py-4 text-base font-semibold text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4.5 sm:text-lg"
          >
            {isSigningOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        </div>
      </div>
    </div>
  )
}
