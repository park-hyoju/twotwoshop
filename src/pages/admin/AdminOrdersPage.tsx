import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AdminOrdersList,
  AdminOrdersPagination,
  AdminOrdersSearch,
  AdminOrdersSummary,
} from '../../components/admin/orders'
import {
  createEmptyAdminOrderFilters,
  parseAdminOrderFiltersFromSearchParams,
} from '../../lib/adminOrderFilters'
import { ADMIN_ROUTES } from '../../lib/adminRoutes'
import { getOrderStatusLabel } from '../../lib/adminOrderStatus'
import {
  AdminOrderRepositoryError,
  fetchAdminOrderSummary,
  fetchAdminOrders,
  updateAdminOrderStatus,
} from '../../services/adminOrderRepository'
import type {
  AdminOrderRow,
  AdminOrderSearchFilters,
  AdminOrderSummaryStats,
  DbOrderStatus,
} from '../../types/adminOrder'

const PAGE_SIZE = 20

const EMPTY_SUMMARY: AdminOrderSummaryStats = {
  todayOrderCount: 0,
  pendingOrderCount: 0,
  shippedOrderCount: 0,
  completedOrderCount: 0,
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminOrderRepositoryError) {
    return error.message
  }

  return '주문 목록을 불러오는 중 오류가 발생했습니다.'
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState<AdminOrderRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState<AdminOrderSummaryStats>(EMPTY_SUMMARY)
  const [page, setPage] = useState(1)
  const [draftFilters, setDraftFilters] = useState<AdminOrderSearchFilters>(() =>
    parseAdminOrderFiltersFromSearchParams(searchParams),
  )
  const [appliedFilters, setAppliedFilters] = useState<AdminOrderSearchFilters>(() =>
    parseAdminOrderFiltersFromSearchParams(searchParams),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    try {
      const stats = await fetchAdminOrderSummary()
      setSummary(stats)
    } catch {
      setSummary(EMPTY_SUMMARY)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await fetchAdminOrders({
        page,
        pageSize: PAGE_SIZE,
        filters: appliedFilters,
      })

      setOrders(result.orders)
      setTotalCount(result.totalCount)
    } catch (error) {
      setOrders([])
      setTotalCount(0)
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [appliedFilters, page])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const nextFilters = parseAdminOrderFiltersFromSearchParams(searchParams)
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setPage(1)
  }, [searchParams])

  function handleFilterChange(field: keyof AdminOrderSearchFilters, value: string) {
    setDraftFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSearch() {
    setPage(1)
    setAppliedFilters({ ...draftFilters })
  }

  function handleReset() {
    const emptyFilters = createEmptyAdminOrderFilters()
    setDraftFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setPage(1)
  }

  async function handleStatusChange(orderId: string, status: DbOrderStatus) {
    const previousOrders = orders
    setStatusErrorMessage(null)
    setUpdatingOrderId(orderId)
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order)),
    )

    try {
      await updateAdminOrderStatus(orderId, status)
      void loadSummary()
    } catch (error) {
      setOrders(previousOrders)
      setStatusErrorMessage(
        error instanceof AdminOrderRepositoryError
          ? error.message
          : '주문 상태 변경 중 오류가 발생했습니다.',
      )
    } finally {
      setUpdatingOrderId(null)
    }
  }

  function handleOrderNumberClick(order: AdminOrderRow) {
    if (import.meta.env.DEV) {
      console.info('[AdminOrdersPage] order detail modal TBD:', order.id)
    }
  }

  function handleCustomerClick(_order: AdminOrderRow) {
    navigate(ADMIN_ROUTES.customers)
  }

  function handleProductClick(_order: AdminOrderRow, productSlug: string | null) {
    if (productSlug) {
      navigate(`${ADMIN_ROUTES.products}?slug=${encodeURIComponent(productSlug)}`)
      return
    }

    navigate(ADMIN_ROUTES.products)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-3">
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">주문 관리</h1>
        <p className="mt-1 text-sm text-neutral-600">
          접수된 주문을 확인하고 배송 상태를 변경합니다.
        </p>
      </div>

      <AdminOrdersSummary stats={summary} />

      <AdminOrdersSearch
        filters={draftFilters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {statusErrorMessage && (
        <p
          role="alert"
          className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {statusErrorMessage}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-neutral-600">주문 목록을 불러오는 중입니다...</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center"
          >
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && orders.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center">
            <div>
              <p className="text-base font-medium text-neutral-700">
                아직 접수된 주문이 없습니다.
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                새로운 주문이 들어오면 이곳에서 바로 확인할 수 있습니다.
              </p>
              {appliedFilters.status !== 'all' && (
                <p className="mt-3 text-sm text-neutral-500">
                  현재 &apos;{getOrderStatusLabel(appliedFilters.status)}&apos; 상태 필터가
                  적용되어 있습니다. 초기화 후 다시 확인해주세요.
                </p>
              )}
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && orders.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <AdminOrdersList
              orders={orders}
              updatingOrderId={updatingOrderId}
              onStatusChange={(orderId, status) => void handleStatusChange(orderId, status)}
              onOrderNumberClick={handleOrderNumberClick}
              onCustomerClick={handleCustomerClick}
              onProductClick={handleProductClick}
              onRowClick={handleOrderNumberClick}
            />
            <div className="shrink-0">
              <AdminOrdersPagination
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={totalCount}
                onPageChange={setPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
