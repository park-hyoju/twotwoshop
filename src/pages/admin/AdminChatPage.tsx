import { useCallback, useEffect, useState } from 'react'
import { useAdminToast } from '../../components/admin/AdminToast'
import {
  AdminConsultationStatusDropdown,
  AdminInquiryDeleteModal,
  AdminInquiryDetailEmpty,
  AdminInquiryDetailPanel,
  AdminInquiryListEmpty,
  AdminInquiryListToolbar,
  AdminInquirySidebarList,
  AdminInquirySidebarSkeleton,
  AdminInquirySoundButton,
  AdminInquiryStatsBar,
} from '../../components/admin/inquiries'
import { AdminOrdersPagination } from '../../components/admin/orders'
import { useAdminInquiryRealtime } from '../../contexts/AdminInquiryRealtimeContext'
import { EMPTY_ADMIN_INQUIRY_FILTERS } from '../../lib/adminInquiryFilters'
import {
  AdminInquiryRepositoryError,
  deleteAdminInquiries,
  deleteAdminInquiry,
  fetchAdminInquiries,
  fetchAdminInquiryById,
  fetchAdminInquirySummary,
  markAdminInquiryAsRead,
  sendAdminInquiryMessage,
  updateAdminInquiryMeta,
} from '../../services/adminInquiryRepository'
import type {
  AdminInquiryRow,
  AdminInquirySearchFilters,
  AdminInquirySummaryStats,
  DbInquiryStatus,
} from '../../types/adminInquiry'
import { getConsultationStatusOption } from '../../lib/consultationStatusDisplay'
import type { ConsultationStatus } from '../../types/consultationStatus'

const PAGE_SIZE = 20

const EMPTY_SUMMARY: AdminInquirySummaryStats = {
  totalCount: 0,
  pendingCount: 0,
  answeredCount: 0,
  todayCount: 0,
  unreadCount: 0,
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminInquiryRepositoryError) {
    return error.message
  }

  return '문의 목록을 불러오는 중 오류가 발생했습니다.'
}

export function AdminChatPage() {
  const { showToast } = useAdminToast()
  const { summary: globalSummary, subscribeListRefresh } = useAdminInquiryRealtime()
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
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadSummary = useCallback(async () => {
    try {
      const stats = await fetchAdminInquirySummary()
      setSummary(stats)
    } catch {
      setSummary(EMPTY_SUMMARY)
    }
  }, [])

  const loadInquiries = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true)
    }
    setErrorMessage(null)

    try {
      const result = await fetchAdminInquiries({
        page,
        pageSize: PAGE_SIZE,
        filters: appliedFilters,
      })

      setInquiries(result.inquiries)
      setTotalCount(result.totalCount)
      setSelectedIds((current) => {
        const next = new Set<string>()
        for (const id of current) {
          if (result.inquiries.some((inquiry) => inquiry.id === id)) {
            next.add(id)
          }
        }
        return next
      })
    } catch (error) {
      setInquiries([])
      setTotalCount(0)
      setErrorMessage(getErrorMessage(error))
    } finally {
      if (!options?.silent) {
        setIsLoading(false)
      }
    }
  }, [appliedFilters, page])

  const refreshSelectedInquiry = useCallback(async () => {
    if (!selectedInquiryId) {
      return
    }

    const detail = await fetchAdminInquiryById(selectedInquiryId)
    if (detail) {
      setSelectedInquiry(detail)
    }
  }, [selectedInquiryId])

  useEffect(() => {
    return subscribeListRefresh(() => {
      void loadSummary()
      void loadInquiries({ silent: true })
      void refreshSelectedInquiry()
    })
  }, [loadInquiries, loadSummary, refreshSelectedInquiry, subscribeListRefresh])

  useEffect(() => {
    setSummary(globalSummary)
  }, [globalSummary])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    void loadInquiries()
  }, [loadInquiries])

  useEffect(() => {
    if (!selectedInquiryId) {
      return
    }

    void refreshSelectedInquiry()
  }, [refreshSelectedInquiry, selectedInquiryId])

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

  function handleToggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleToggleSelectAll() {
    const allSelected =
      inquiries.length > 0 && inquiries.every((inquiry) => selectedIds.has(inquiry.id))

    if (allSelected) {
      setSelectedIds(new Set())
      return
    }

    setSelectedIds(new Set(inquiries.map((inquiry) => inquiry.id)))
  }

  function openDeleteModal(ids: string[]) {
    setDeleteTargetIds(ids)
    setIsDeleteModalOpen(true)
  }

  function handleDeleteClick(inquiry: AdminInquiryRow) {
    openDeleteModal([inquiry.id])
  }

  function handleBulkDeleteClick() {
    openDeleteModal(Array.from(selectedIds))
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return
    }

    setIsDeleteModalOpen(false)
    setDeleteTargetIds([])
  }

  async function handleConfirmDelete() {
    if (deleteTargetIds.length === 0) {
      return
    }

    setIsDeleting(true)

    try {
      if (deleteTargetIds.length === 1) {
        await deleteAdminInquiry(deleteTargetIds[0])
      } else {
        await deleteAdminInquiries(deleteTargetIds)
      }

      if (selectedInquiryId && deleteTargetIds.includes(selectedInquiryId)) {
        setSelectedInquiry(null)
        setSelectedInquiryId(null)
        setShowMobileDetail(false)
        setSaveErrorMessage(null)
      }

      setSelectedIds((current) => {
        const next = new Set(current)
        for (const id of deleteTargetIds) {
          next.delete(id)
        }
        return next
      })

      setInquiries((current) => current.filter((inquiry) => !deleteTargetIds.includes(inquiry.id)))
      setTotalCount((current) => Math.max(0, current - deleteTargetIds.length))
      showToast(
        deleteTargetIds.length > 1
          ? `${deleteTargetIds.length}건의 문의가 삭제되었습니다.`
          : '문의가 삭제되었습니다.',
      )
      setIsDeleteModalOpen(false)
      setDeleteTargetIds([])
      void loadSummary()
      void loadInquiries({ silent: true })
    } catch (error) {
      showToast(getErrorMessage(error), { durationMs: 4000 })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleInquiryClick(inquiry: AdminInquiryRow) {
    setSelectedInquiry({
      ...inquiry,
      has_unread_for_admin: false,
      admin_unread_count: 0,
    })
    setSelectedInquiryId(inquiry.id)
    setShowMobileDetail(true)
    setSaveErrorMessage(null)

    try {
      await markAdminInquiryAsRead(inquiry.id)
      setInquiries((current) =>
        current.map((item) =>
          item.id === inquiry.id
            ? { ...item, has_unread_for_admin: false, admin_unread_count: 0 }
            : item,
        ),
      )
      void loadSummary()
    } catch {
      // Read marking failure should not block opening the chat room.
    }
  }

  function handleBackToList() {
    setShowMobileDetail(false)
  }

  async function handleSendMessage(input: { message: string; status: DbInquiryStatus }) {
    if (!selectedInquiry) {
      return
    }

    setIsSubmitting(true)
    setSaveErrorMessage(null)

    try {
      await sendAdminInquiryMessage({
        id: selectedInquiry.id,
        message: input.message,
        status: input.status,
      })

      await refreshSelectedInquiry()
      void loadSummary()
      void loadInquiries({ silent: true })
      showToast('답변이 전송되었습니다.')
    } catch (error) {
      setSaveErrorMessage(getErrorMessage(error))
      showToast(getErrorMessage(error), { durationMs: 4000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateMeta(input: { status: DbInquiryStatus; adminNote: string }) {
    if (!selectedInquiry) {
      return
    }

    try {
      await updateAdminInquiryMeta({
        id: selectedInquiry.id,
        status: input.status,
        adminNote: input.adminNote,
      })

      await refreshSelectedInquiry()
      void loadSummary()
      void loadInquiries({ silent: true })
      showToast('문의 상태가 저장되었습니다.')
    } catch (error) {
      setSaveErrorMessage(getErrorMessage(error))
      showToast(getErrorMessage(error), { durationMs: 4000 })
    }
  }

  const hasActiveFilters =
    appliedFilters.query.trim() !== '' ||
    appliedFilters.inquiryType !== 'all' ||
    appliedFilters.status !== 'all'

  function handleConsultationStatusChanged(nextStatus: ConsultationStatus) {
    const option = getConsultationStatusOption(nextStatus)
    showToast(`상담 상태가 "${option.label}"(으)로 변경되었습니다.`)
  }

  return (
    <div className="-m-4 flex min-h-[calc(100dvh-8rem)] flex-col overflow-hidden sm:-m-6 lg:-m-8">
      <header className="admin-chat-panel shrink-0 border border-neutral-200/60 bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Customer Care
            </p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
              상담 관리
            </h1>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <AdminConsultationStatusDropdown
              onStatusChanged={handleConsultationStatusChanged}
              onError={(message) => showToast(message, { durationMs: 4000 })}
            />
            <AdminInquirySoundButton />
          </div>
        </div>
        <div className="mt-3">
          <AdminInquiryStatsBar stats={summary} />
        </div>
      </header>

      <div className="mt-3 flex min-h-0 flex-1 gap-3">
        <section
          className={`admin-chat-panel flex min-h-0 w-full flex-col overflow-hidden border border-neutral-200/60 bg-white lg:w-[35%] ${
            showMobileDetail ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <AdminInquiryListToolbar
            filters={draftFilters}
            selectedCount={selectedIds.size}
            onChange={handleFilterChange}
            onSearch={handleSearch}
            onReset={handleReset}
            onBulkDelete={selectedIds.size > 0 ? handleBulkDeleteClick : undefined}
          />

          {isLoading && <AdminInquirySidebarSkeleton />}

          {!isLoading && errorMessage && (
            <div
              role="alert"
              className="m-4 rounded-[20px] border border-red-200 bg-red-50 px-5 py-8 text-center"
            >
              <p className="text-sm font-medium text-red-700">{errorMessage}</p>
              <button
                type="button"
                onClick={() => void loadInquiries()}
                className="mt-3 rounded-2xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800"
              >
                다시 시도
              </button>
            </div>
          )}

          {!isLoading && !errorMessage && inquiries.length === 0 && (
            <AdminInquiryListEmpty hasActiveFilters={hasActiveFilters} onReset={handleReset} />
          )}

          {!isLoading && !errorMessage && inquiries.length > 0 && (
            <>
              <AdminInquirySidebarList
                inquiries={inquiries}
                activeId={selectedInquiryId}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onSelect={(inquiry) => void handleInquiryClick(inquiry)}
                onDelete={handleDeleteClick}
              />
              <div className="shrink-0 border-t border-neutral-100 px-3 py-3">
                <AdminOrdersPagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  totalCount={totalCount}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </section>

        <section
          className={`admin-chat-panel flex min-h-0 w-full flex-col overflow-hidden border border-neutral-200/60 bg-white lg:w-[65%] ${
            showMobileDetail ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedInquiry ? (
            <AdminInquiryDetailPanel
              inquiry={selectedInquiry}
              isSubmitting={isSubmitting}
              errorMessage={saveErrorMessage}
              onSendMessage={(input) => void handleSendMessage(input)}
              onUpdateMeta={(input) => void handleUpdateMeta(input)}
              onRefresh={() => void refreshSelectedInquiry()}
              onDelete={() => handleDeleteClick(selectedInquiry)}
              onBack={handleBackToList}
            />
          ) : (
            <AdminInquiryDetailEmpty />
          )}
        </section>
      </div>

      <AdminInquiryDeleteModal
        isOpen={isDeleteModalOpen}
        count={deleteTargetIds.length}
        isSubmitting={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
