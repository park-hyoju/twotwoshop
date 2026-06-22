import { useCallback, useEffect, useState } from 'react'
import {
  DashboardErrorState,
  DashboardHeader,
  DashboardLoadingState,
  DashboardProductStats,
  DashboardQuickActions,
  DashboardRecentOrders,
  DashboardRevenueSummary,
  DashboardSalesCalendar,
  DashboardStatCard,
  DashboardTodayTasks,
} from '../../components/admin/dashboard'
import { formatPrice } from '../../lib/formatPrice'
import {
  AdminDashboardRepositoryError,
  fetchAdminDashboardData,
} from '../../services/adminDashboardRepository'
import type { AdminDashboardData } from '../../types/adminDashboard'

function formatCount(value: number): string {
  return value.toLocaleString('ko-KR')
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminDashboardRepositoryError) {
    return error.message
  }

  return '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
}

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await fetchAdminDashboardData()
      setDashboard(data)
    } catch (error) {
      setDashboard(null)
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  if (isLoading) {
    return <DashboardLoadingState />
  }

  if (errorMessage) {
    return <DashboardErrorState message={errorMessage} onRetry={() => void loadDashboard()} />
  }

  if (!dashboard) {
    return null
  }

  const { orderStats, taskStats, revenueStats, productStats, recentOrders, dailyActivity } =
    dashboard

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4">
        <DashboardHeader />
        <DashboardQuickActions />
      </div>

      <DashboardTodayTasks taskStats={taskStats} />

      <DashboardRecentOrders orders={recentOrders} />

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <DashboardStatCard label="오늘 주문" value={`${formatCount(orderStats.todayOrderCount)}건`} />
        <DashboardStatCard label="오늘 매출" value={formatPrice(revenueStats.todayRevenue)} />
        <DashboardStatCard label="이번 달 매출" value={formatPrice(revenueStats.monthRevenue)} />
        <DashboardStatCard label="총 주문" value={`${formatCount(orderStats.totalOrderCount)}건`} />
      </div>

      <DashboardProductStats productStats={productStats} />

      <DashboardSalesCalendar dailyActivity={dailyActivity} />

      <DashboardRevenueSummary revenueStats={revenueStats} />
    </div>
  )
}
