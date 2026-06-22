import { useCallback, useEffect, useState } from 'react'
import { OrderStatusBadge } from '../../components/admin/orders/OrderStatusBadge'
import { formatDateTime } from '../../lib/formatDateTime'
import { formatPrice } from '../../lib/formatPrice'
import {
  AdminDashboardRepositoryError,
  fetchAdminDashboardData,
} from '../../services/adminDashboardRepository'
import type { AdminDashboardData } from '../../types/adminDashboard'

interface DashboardStatCardProps {
  label: string
  value: string
}

function DashboardStatCard({ label, value }: DashboardStatCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-neutral-500 sm:text-base">{label}</p>
      <p className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl">{value}</p>
    </div>
  )
}

interface SummaryRowProps {
  label: string
  value: string
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 py-3 last:border-b-0">
      <dt className="text-sm text-neutral-600 sm:text-base">{label}</dt>
      <dd className="text-sm font-semibold text-neutral-900 sm:text-base">{value}</dd>
    </div>
  )
}

function formatCount(value: number): string {
  return value.toLocaleString('ko-KR')
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminDashboardRepositoryError) {
    return error.message
  }

  return '대시보드 데이터를 불러오는 중 오류가 발생했습니다.'
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
    return (
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">대시보드</h1>
        <p className="mt-2 text-base text-neutral-600 sm:text-lg">
          투투샵 운영 현황을 한눈에 확인합니다.
        </p>
        <div className="mt-8 rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
          <p className="text-base text-neutral-600 sm:text-lg">대시보드 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">대시보드</h1>
        <p className="mt-2 text-base text-neutral-600 sm:text-lg">
          투투샵 운영 현황을 한눈에 확인합니다.
        </p>
        <div
          role="alert"
          className="mt-8 rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
        >
          <p className="text-base font-medium text-red-700 sm:text-lg">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800 sm:text-base"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return null
  }

  const { orderStats, revenueStats, productStats, recentOrders } = dashboard

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">대시보드</h1>
      <p className="mt-2 text-base text-neutral-600 sm:text-lg">
        투투샵 운영 현황을 한눈에 확인합니다.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="오늘 주문" value={formatCount(orderStats.todayOrderCount)} />
        <DashboardStatCard label="오늘 매출" value={formatPrice(revenueStats.todayRevenue)} />
        <DashboardStatCard label="이번 달 매출" value={formatPrice(revenueStats.monthRevenue)} />
        <DashboardStatCard label="총 주문" value={formatCount(orderStats.totalOrderCount)} />
        <DashboardStatCard label="총 상품" value={formatCount(productStats.totalCount)} />
        <DashboardStatCard label="품절 상품" value={formatCount(productStats.soldOutCount)} />
        <DashboardStatCard label="숨김 상품" value={formatCount(productStats.hiddenCount)} />
        <DashboardStatCard label="미처리 주문" value={formatCount(orderStats.pendingOrderCount)} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">최근 주문</h2>

          {recentOrders.length === 0 ? (
            <p className="mt-6 text-center text-sm text-neutral-500 sm:text-base">
              최근 주문이 없습니다.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead>
                  <tr className="text-left text-sm font-semibold text-neutral-700">
                    <th className="px-3 py-3">주문번호</th>
                    <th className="px-3 py-3">주문자</th>
                    <th className="px-3 py-3">금액</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3">주문일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm text-neutral-800">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-3 py-3 font-medium text-neutral-900">
                        {order.order_number}
                      </td>
                      <td className="px-3 py-3">{order.customer_name}</td>
                      <td className="px-3 py-3 font-semibold">{formatPrice(order.total_amount)}</td>
                      <td className="px-3 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {formatDateTime(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">상품 현황</h2>
            <dl className="mt-2">
              <SummaryRow label="판매중" value={`${formatCount(productStats.activeCount)}개`} />
              <SummaryRow label="품절" value={`${formatCount(productStats.soldOutCount)}개`} />
              <SummaryRow label="숨김" value={`${formatCount(productStats.hiddenCount)}개`} />
            </dl>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">매출 요약</h2>
            <dl className="mt-2">
              <SummaryRow label="오늘 매출" value={formatPrice(revenueStats.todayRevenue)} />
              <SummaryRow label="이번 달 매출" value={formatPrice(revenueStats.monthRevenue)} />
              <SummaryRow label="총 매출" value={formatPrice(revenueStats.totalRevenue)} />
            </dl>
            <p className="mt-4 text-xs text-neutral-500">취소된 주문은 매출 합계에서 제외됩니다.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
