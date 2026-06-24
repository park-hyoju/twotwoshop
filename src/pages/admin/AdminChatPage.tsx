import { useCallback, useEffect, useState } from 'react'
import {
  AdminInquiriesList,
  AdminInquiriesSearch,
  AdminInquiriesSummary,
  AdminInquiryDetailModal,
} from '../../components/admin/inquiries'
import { AdminOrdersPagination } from '../../components/admin/orders'
import { EMPTY_ADMIN_INQUIRY_FILTERS } from '../../lib/adminInquiryFilters'
import { getInquiryStatusLabel, getInquiryTypeLabel } from '../../lib/adminInquiryDisplay'
import {
  AdminInquiryRepositoryError,
  fetchAdminInquiries,
  fetchAdminInquirySummary,
  updateAdminInquiry,
} from '../../services/adminInquiryRepository'
import type {
  AdminInquiryRow,
  AdminInquirySearchFilters,
  AdminInquirySummaryStats,
  DbInquiryStatus,
} from '../../types/adminInquiry'

const PAGE_SIZE = 20

const EMPTY_SUMMARY: AdminInquirySummaryStats = {
  totalCount: 0,
  pendingCount: 0,
  todayCount: 0,
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminInquiryRepositoryError) {
    return error.message
  }

  return '문의 목록을 불러오는 중 오류가 발생했습니다.'
}

export function AdminChatPage() {
  const [inquiries, setInquiries] = useState<AdminInquiryRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState<AdminInquirySummaryStats>(EMPTY_SUMMARY)
  const [page, setPage] = useState(1)
  const [draftFilters, setDraftFilters] = useState<AdminInquirySearchFilters>(
    EMPTY_ADMIN_INQUIRY_FILTERS,
  )
  const [appliedFilters, setAppliedFilters] = useState<AdminInquirySearchFilters>(
    EMPTY_ADMIN_INQUIRY_FILTERS,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiryRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    try {
      const stats = await fetchAdminInquirySummary()
      setSummary(stats)
    } catch {
      setSummary(EMPTY_SUMMARY)
    }
  }, [])

  const loadInquiries = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await fetchAdminInquiries({
        page,
        pageSize: PAGE_SIZE,
        filters: appliedFilters,
      })

      setInquiries(result.inquiries)
      setTotalCount(result.totalCount)
    } catch (error) {
      setInquiries([])
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
    void loadInquiries()
  }, [loadInquiries])

  function handleFilterChange(field: keyof AdminInquirySearchFilters, value: string) {
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
    setDraftFilters(EMPTY_ADMIN_INQUIRY_FILTERS)
    setAppliedFilters(EMPTY_ADMIN_INQUIRY_FILTERS)
    setPage(1)
  }

  function handleInquiryClick(inquiry: AdminInquiryRow) {
    setSelectedInquiry(inquiry)
    setSaveErrorMessage(null)
  }

  function handleCloseDetail() {
    setSelectedInquiry(null)
    setSaveErrorMessage(null)
  }

  async function handleSave(input: {
    status: DbInquiryStatus
    adminReply: string
    adminNote: string
  }) {
    if (!selectedInquiry) {
      return
    }

    setIsSubmitting(true)
    setSaveErrorMessage(null)

    try {
      await updateAdminInquiry({
        id: selectedInquiry.id,
        status: input.status,
        adminReply: input.adminReply,
        adminNote: input.adminNote,
      })

      handleCloseDetail()
      void loadSummary()
      void loadInquiries()
    } catch (error) {
      setSaveErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasActiveFilters =
    appliedFilters.query.trim() !== '' ||
    appliedFilters.inquiryType !== 'all' ||
    appliedFilters.status !== 'all'

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-3">
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">상담 관리</h1>
        <p className="mt-1 text-sm text-neutral-600">
          고객 1:1 문의를 확인하고 답변·상태를 관리합니다.
        </p>
      </div>

      <AdminInquiriesSummary stats={summary} />

      <AdminInquiriesSearch
        filters={draftFilters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-neutral-600">문의 목록을 불러오는 중입니다...</p>
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
              onClick={() => void loadInquiries()}
              className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && inquiries.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center">
            <div>
              <p className="text-base font-medium text-neutral-700">아직 접수된 문의가 없습니다.</p>
              {hasActiveFilters && (
                <p className="mt-3 text-sm text-neutral-500">
                  {appliedFilters.inquiryType !== 'all' && (
                    <span className="block">
                      문의유형: {getInquiryTypeLabel(appliedFilters.inquiryType)}
                    </span>
                  )}
                  {appliedFilters.status !== 'all' && (
                    <span className="block">
                      상태: {getInquiryStatusLabel(appliedFilters.status)}
                    </span>
                  )}
                  검색/필터 조건을 초기화한 뒤 다시 확인해 주세요.
                </p>
              )}
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && inquiries.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <AdminInquiriesList inquiries={inquiries} onInquiryClick={handleInquiryClick} />
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

      <AdminInquiryDetailModal
        inquiry={selectedInquiry}
        isOpen={selectedInquiry !== null}
        isSubmitting={isSubmitting}
        errorMessage={saveErrorMessage}
        onClose={handleCloseDetail}
        onSave={(input) => void handleSave(input)}
      />
    </div>
  )
}
