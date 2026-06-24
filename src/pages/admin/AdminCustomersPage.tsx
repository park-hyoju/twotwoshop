import { useCallback, useEffect, useState } from 'react'
import {
  AdminCustomerDetailModal,
  AdminCustomersList,
  AdminCustomersSearch,
} from '../../components/admin/customers'
import { AdminOrdersPagination } from '../../components/admin/orders'
import {
  EMPTY_ADMIN_CUSTOMER_FILTERS,
  applyCustomerQuickFilter,
  type CustomerQuickFilter,
} from '../../lib/adminCustomerFilters'
import {
  AdminCustomerRepositoryError,
  fetchAdminCustomerDetail,
  fetchAdminCustomers,
  updateAdminCustomer,
} from '../../services/adminCustomerRepository'
import type {
  AdminCustomerDetail,
  AdminCustomerRow,
  AdminCustomerSearchFilters,
  CustomerStatus,
} from '../../types/adminCustomer'

const PAGE_SIZE = 20

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminCustomerRepositoryError) {
    return error.message
  }

  return '고객 목록을 불러오는 중 오류가 발생했습니다.'
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [draftFilters, setDraftFilters] = useState<AdminCustomerSearchFilters>(
    EMPTY_ADMIN_CUSTOMER_FILTERS,
  )
  const [appliedFilters, setAppliedFilters] = useState<AdminCustomerSearchFilters>(
    EMPTY_ADMIN_CUSTOMER_FILTERS,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)

  const loadCustomers = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await fetchAdminCustomers({
        page,
        pageSize: PAGE_SIZE,
        filters: appliedFilters,
      })

      setCustomers(result.customers)
      setTotalCount(result.totalCount)
    } catch (error) {
      setCustomers([])
      setTotalCount(0)
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [appliedFilters, page])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    if (!selectedGroupKey) {
      setSelectedCustomer(null)
      return
    }

    setIsDetailLoading(true)
    setSaveErrorMessage(null)

    void fetchAdminCustomerDetail(selectedGroupKey)
      .then((detail) => {
        setSelectedCustomer(detail)
      })
      .catch((error) => {
        setSelectedCustomer(null)
        setSaveErrorMessage(getErrorMessage(error))
      })
      .finally(() => {
        setIsDetailLoading(false)
      })
  }, [selectedGroupKey])

  function handleSearch() {
    setPage(1)
    setAppliedFilters({ ...draftFilters })
  }

  function handleReset() {
    setDraftFilters(EMPTY_ADMIN_CUSTOMER_FILTERS)
    setAppliedFilters(EMPTY_ADMIN_CUSTOMER_FILTERS)
    setPage(1)
  }

  function handleQueryChange(query: string) {
    setDraftFilters((current) => ({ ...current, query }))
  }

  function handleQuickFilterChange(quickFilter: CustomerQuickFilter) {
    setDraftFilters((current) => ({
      ...applyCustomerQuickFilter(quickFilter),
      query: current.query,
      sort: current.sort,
    }))
  }

  function handleSortChange(sort: AdminCustomerSearchFilters['sort']) {
    setDraftFilters((current) => ({ ...current, sort }))
  }

  function handleCustomerClick(customer: AdminCustomerRow) {
    setSelectedGroupKey(customer.groupKey)
  }

  function handleCloseDetail() {
    setSelectedGroupKey(null)
    setSelectedCustomer(null)
    setSaveErrorMessage(null)
  }

  async function handleSave(input: { adminNote: string; customerStatus: CustomerStatus }) {
    if (!selectedCustomer) {
      return
    }

    setIsSubmitting(true)
    setSaveErrorMessage(null)

    try {
      await updateAdminCustomer({
        groupKey: selectedCustomer.groupKey,
        linkedCustomerIds: selectedCustomer.linkedCustomerIds,
        phone: selectedCustomer.phone,
        adminNote: input.adminNote,
        customerStatus: input.customerStatus,
      })

      handleCloseDetail()
      void loadCustomers()
    } catch (error) {
      setSaveErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasActiveFilters =
    appliedFilters.query.trim() !== '' ||
    appliedFilters.memberType !== 'all' ||
    appliedFilters.grade !== 'all' ||
    appliedFilters.status !== 'all'

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-3">
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">고객 관리</h1>
        <p className="mt-1 text-sm text-neutral-600">
          주문 이력을 기준으로 회원·비회원 고객을 통합 관리합니다.
        </p>
      </div>

      <AdminCustomersSearch
        filters={draftFilters}
        onQueryChange={handleQueryChange}
        onQuickFilterChange={handleQuickFilterChange}
        onSortChange={handleSortChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-neutral-600">고객 목록을 불러오는 중입니다...</p>
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
              onClick={() => void loadCustomers()}
              className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && customers.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center">
            <div>
              <p className="text-base font-medium text-neutral-700">아직 고객 정보가 없습니다.</p>
              <p className="mt-2 text-sm text-neutral-500">
                주문이 들어오면 회원/비회원 고객 정보가 자동으로 쌓입니다.
              </p>
              {hasActiveFilters && (
                <p className="mt-3 text-sm text-neutral-500">
                  검색/필터 조건을 초기화한 뒤 다시 확인해 주세요.
                </p>
              )}
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && customers.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <AdminCustomersList customers={customers} onCustomerClick={handleCustomerClick} />
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

      <AdminCustomerDetailModal
        customer={isDetailLoading ? null : selectedCustomer}
        isOpen={selectedGroupKey !== null}
        isSubmitting={isSubmitting}
        errorMessage={saveErrorMessage}
        onClose={handleCloseDetail}
        onSave={(input) => void handleSave(input)}
      />
    </div>
  )
}
