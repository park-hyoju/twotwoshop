import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdminToast } from '../../components/admin/AdminToast'
import {
  AdminOrderDetailModal,
  AdminOrdersList,
  AdminOrdersPagination,
  AdminOrdersResetModal,
  AdminOrdersSearch,
  AdminOrdersSummary,
} from '../../components/admin/orders'
import {
  createEmptyAdminOrderFilters,
  parseAdminOrderFiltersFromSearchParams,
} from '../../lib/adminOrderFilters'
import { getOrderStatusLabel } from '../../lib/adminOrderStatus'
import {
  AdminOrderRepositoryError,
  applyAdminOrderAction,
  deleteAllAdminOrders,
  fetchAdminOrderById,
  fetchAdminOrderSummary,
  fetchAdminOrders,
  saveAdminOrderShippingInfo,
} from '../../services/adminOrderRepository'
import type {
  AdminOrderFulfillmentAction,
  AdminOrderRow,
  AdminOrderSearchFilters,
  AdminOrderSummaryStats,
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
  const { showToast } = useAdminToast()
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
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null)
  const [isFulfillmentProcessing, setIsFulfillmentProcessing] = useState(false)
  const [fulfillmentErrorMessage, setFulfillmentErrorMessage] = useState<string | null>(null)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isResettingOrders, setIsResettingOrders] = useState(false)

  const loadSummary = useCallback(async () => {
    try {
      const stats = await fetchAdminOrderSummary()
      setSummary(stats)
      return stats
    } catch (error) {
      console.error('[AdminOrdersPage] loadSummary failed', error)
      setSummary(EMPTY_SUMMARY)
      throw error
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
    void loadSummary().catch(() => undefined)
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

  async function handleDetailClick(order: AdminOrderRow) {
    setSelectedOrder(order)
    setDetailErrorMessage(null)
    setFulfillmentErrorMessage(null)
    setIsDetailLoading(true)

    try {
      const detail = await fetchAdminOrderById(order.id)
      if (detail) {
        setSelectedOrder(detail)
      } else {
        setDetailErrorMessage('주문 상세를 찾을 수 없습니다.')
      }
    } catch (error) {
      setDetailErrorMessage(
        error instanceof AdminOrderRepositoryError
          ? error.message
          : '주문 상세를 불러오지 못했습니다.',
      )
    } finally {
      setIsDetailLoading(false)
    }
  }

  async function refreshOrderState(updated: AdminOrderRow) {
    setSelectedOrder(updated)
    setOrders((current) =>
      current.map((order) => (order.id === updated.id ? { ...order, ...updated, order_items: [] } : order)),
    )
    void loadSummary().catch(() => undefined)
    void loadOrders()
  }

  async function handleSaveShipping(shipping: { courier: string; trackingNumber: string }) {
    if (!selectedOrder) {
      return
    }

    setFulfillmentErrorMessage(null)
    setIsFulfillmentProcessing(true)

    try {
      const updated = await saveAdminOrderShippingInfo(selectedOrder, shipping)
      await refreshOrderState(updated)
      showToast('운송장 정보가 저장되었습니다.')
    } catch (error) {
      console.error('[AdminOrdersPage] save shipping failed', {
        orderId: selectedOrder.id,
        error,
        cause: error instanceof AdminOrderRepositoryError ? error.cause : undefined,
      })
      setFulfillmentErrorMessage(
        error instanceof AdminOrderRepositoryError
          ? error.message
          : '송장 저장 중 오류가 발생했습니다.',
      )
    } finally {
      setIsFulfillmentProcessing(false)
    }
  }

  async function handleFulfillmentAction(
    action: AdminOrderFulfillmentAction,
    shipping?: { courier: string; trackingNumber: string },
  ) {
    if (!selectedOrder) {
      return
    }

    setFulfillmentErrorMessage(null)
    setIsFulfillmentProcessing(true)

    try {
      const updated = await applyAdminOrderAction(selectedOrder, action, shipping)
      await refreshOrderState(updated)

      const successMessages: Partial<Record<AdminOrderFulfillmentAction, string>> = {
        confirm_payment: '입금 확인 처리되었습니다.',
        mark_preparing: '배송준비 상태로 변경되었습니다.',
        mark_shipping: '배송중 상태로 변경되었습니다.',
        mark_delivered: '배송완료 처리되었습니다.',
        cancel: '주문이 취소되었습니다.',
      }
      const message = successMessages[action]
      if (message) {
        showToast(message)
      }
    } catch (error) {
      console.error('[AdminOrdersPage] fulfillment action failed', {
        action,
        orderId: selectedOrder.id,
        error,
        cause: error instanceof AdminOrderRepositoryError ? error.cause : undefined,
      })
      setFulfillmentErrorMessage(
        error instanceof AdminOrderRepositoryError
          ? error.message
          : '주문 처리 중 오류가 발생했습니다.',
      )
    } finally {
      setIsFulfillmentProcessing(false)
    }
  }

  function handleCloseDetail() {
    setSelectedOrder(null)
    setDetailErrorMessage(null)
    setFulfillmentErrorMessage(null)
    setIsDetailLoading(false)
    setIsFulfillmentProcessing(false)
  }

  async function handleResetAllOrders() {
    setIsResettingOrders(true)

    try {
      const deletedCount = await deleteAllAdminOrders()
      setIsResetModalOpen(false)
      setSelectedOrder(null)
      setPage(1)
      setSummary(EMPTY_SUMMARY)
      setOrders([])
      setTotalCount(0)
      setErrorMessage(null)

      await Promise.all([loadSummary(), loadOrders()])
      showToast(
        deletedCount > 0
          ? `주문 ${deletedCount.toLocaleString('ko-KR')}건이 삭제되었습니다.`
          : '삭제할 주문이 없습니다.',
      )
    } catch (error) {
      console.error('[AdminOrdersPage] reset all orders failed', error)
      const message =
        error instanceof AdminOrderRepositoryError
          ? error.message
          : '주문 데이터 삭제 중 오류가 발생했습니다.'
      showToast(message)
    } finally {
      setIsResettingOrders(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-3">
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">주문 관리</h1>
          <p className="mt-1 text-sm text-neutral-600">
            입금 확인부터 배송 완료까지 주문 상태를 처리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsResetModalOpen(true)}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
        >
          테스트 주문 초기화
        </button>
      </div>

      <AdminOrdersSummary stats={summary} />

      <AdminOrdersSearch
        filters={draftFilters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

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
            <AdminOrdersList orders={orders} onDetailClick={(order) => void handleDetailClick(order)} />
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

      <AdminOrderDetailModal
        order={selectedOrder}
        isLoading={isDetailLoading}
        errorMessage={detailErrorMessage}
        isFulfillmentProcessing={isFulfillmentProcessing}
        fulfillmentErrorMessage={fulfillmentErrorMessage}
        onClose={handleCloseDetail}
        onFulfillmentAction={handleFulfillmentAction}
        onSaveShipping={handleSaveShipping}
      />

      <AdminOrdersResetModal
        isOpen={isResetModalOpen}
        isSubmitting={isResettingOrders}
        onClose={() => {
          if (!isResettingOrders) {
            setIsResetModalOpen(false)
          }
        }}
        onConfirm={() => void handleResetAllOrders()}
      />
    </div>
  )
}
