import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AdminOrdersList,
  AdminOrdersPagination,
  AdminOrdersSearch,
} from '../../components/admin/orders'
import {
  createEmptyAdminOrderFilters,
  parseAdminOrderFiltersFromSearchParams,
} from '../../lib/adminOrderFilters'
import {
  AdminOrderRepositoryError,
  fetchAdminOrders,
  updateAdminOrderStatus,
} from '../../services/adminOrderRepository'
import type { AdminOrderRow, AdminOrderSearchFilters, DbOrderStatus } from '../../types/adminOrder'
import { getOrderStatusLabel } from '../../lib/adminOrderStatus'

const PAGE_SIZE = 20

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminOrderRepositoryError) {
    return error.message
  }

  return '주문 목록을 불러오는 중 오류가 발생했습니다.'
}

export function AdminOrdersPage() {
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState<AdminOrderRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">주문 관리</h1>
      <p className="mt-2 text-base text-neutral-600 sm:text-lg">
        접수된 주문을 확인하고 배송 상태를 변경합니다.
      </p>

      <div className="mt-6">
        <AdminOrdersSearch
          filters={draftFilters}
          onChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleReset}
        />
      </div>

      {statusErrorMessage && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:text-base"
        >
          {statusErrorMessage}
        </p>
      )}

      <div className="mt-6">
        {isLoading && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-base text-neutral-600 sm:text-lg">주문 목록을 불러오는 중입니다...</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
          >
            <p className="text-base font-medium text-red-700 sm:text-lg">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800 sm:text-base"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && orders.length === 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-base font-medium text-neutral-700 sm:text-lg">
              아직 접수된 주문이 없습니다.
            </p>
            <p className="mt-2 text-sm text-neutral-500 sm:text-base">
              주문이 들어오면 이곳에서 바로 확인할 수 있습니다.
            </p>
            {appliedFilters.status !== 'all' && (
              <p className="mt-3 text-sm text-neutral-500">
                현재 &apos;{getOrderStatusLabel(appliedFilters.status)}&apos; 상태 필터가 적용되어
                있습니다. 초기화 후 다시 확인해주세요.
              </p>
            )}
          </div>
        )}

        {!isLoading && !errorMessage && orders.length > 0 && (
          <div className="space-y-4">
            <AdminOrdersList
              orders={orders}
              updatingOrderId={updatingOrderId}
              onStatusChange={(orderId, status) => void handleStatusChange(orderId, status)}
              onOrderClick={(order) => {
                if (import.meta.env.DEV) {
                  console.info('[AdminOrdersPage] order row clicked (detail modal TBD):', order.id)
                }
              }}
            />
            <AdminOrdersPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
