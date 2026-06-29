import { useCallback, useEffect, useState } from 'react'
import { AdminNoticeFormModal, AdminNoticesList } from '../../components/admin/notices'
import { useAdminToast } from '../../components/admin/AdminToast'
import {
  AdminNoticeRepositoryError,
  createAdminNotice,
  deleteAdminNotice,
  fetchAdminNotices,
  setAdminNoticeActive,
  setAdminNoticePinned,
  updateAdminNotice,
} from '../../services/adminNoticeRepository'
import type { AdminNoticeFormInput, NoticeRow } from '../../types/notice'

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminNoticeRepositoryError) {
    return error.message
  }

  return '공지사항 작업을 처리하지 못했습니다.'
}

export function AdminNoticesPage() {
  const { showToast } = useAdminToast()
  const [notices, setNotices] = useState<NoticeRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingNotice, setEditingNotice] = useState<NoticeRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const loadNotices = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const rows = await fetchAdminNotices()
      setNotices(rows)
    } catch (error) {
      setNotices([])
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotices()
  }, [loadNotices])

  function openCreateForm() {
    setEditingNotice(null)
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(notice: NoticeRow) {
    setEditingNotice(notice)
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) {
      return
    }

    setIsFormOpen(false)
    setEditingNotice(null)
    setFormError(null)
  }

  async function handleSubmit(input: AdminNoticeFormInput) {
    setIsSaving(true)
    setFormError(null)

    try {
      if (editingNotice) {
        await updateAdminNotice(editingNotice.id, input)
        showToast('공지사항이 수정되었습니다.')
      } else {
        await createAdminNotice(input)
        showToast('공지사항이 등록되었습니다.')
      }

      closeForm()
      await loadNotices()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(noticeId: string) {
    const target = notices.find((notice) => notice.id === noticeId)
    if (!target) {
      return
    }

    const confirmed = window.confirm(`"${target.title}" 공지를 삭제할까요?`)
    if (!confirmed) {
      return
    }

    setActionId(noticeId)

    try {
      await deleteAdminNotice(noticeId)
      showToast('공지사항이 삭제되었습니다.')
      await loadNotices()
    } catch (error) {
      showToast(getErrorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  async function handleToggleActive(noticeId: string, isActive: boolean) {
    setActionId(noticeId)

    try {
      await setAdminNoticeActive(noticeId, isActive)
      showToast(isActive ? '공지가 노출됩니다.' : '공지가 비노출 처리되었습니다.')
      await loadNotices()
    } catch (error) {
      showToast(getErrorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  async function handleTogglePinned(noticeId: string, isPinned: boolean) {
    setActionId(noticeId)

    try {
      await setAdminNoticePinned(noticeId, isPinned)
      showToast(isPinned ? '공지가 상단에 고정되었습니다.' : '상단 고정이 해제되었습니다.')
      await loadNotices()
    } catch (error) {
      showToast(getErrorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  const activeCount = notices.filter((notice) => notice.is_active).length
  const pinnedCount = notices.filter((notice) => notice.is_pinned).length

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">공지관리</h1>
          <p className="mt-2 text-base text-neutral-600 sm:text-lg">
            쇼핑몰 공지사항을 작성하고 노출·고정을 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          공지 작성
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">전체 공지</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{notices.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">노출 중</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">상단 고정</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{pinnedCount}</p>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
            공지사항 목록을 불러오는 중입니다...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700"
          >
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadNotices()}
              className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && notices.length === 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
            등록된 공지사항이 없습니다.
          </div>
        )}

        {!isLoading && !errorMessage && notices.length > 0 && (
          <AdminNoticesList
            notices={notices}
            actionId={actionId}
            onEdit={openEditForm}
            onDelete={(id) => void handleDelete(id)}
            onToggleActive={(id, isActive) => void handleToggleActive(id, isActive)}
            onTogglePinned={(id, isPinned) => void handleTogglePinned(id, isPinned)}
          />
        )}
      </div>

      <AdminNoticeFormModal
        open={isFormOpen}
        notice={editingNotice}
        isSaving={isSaving}
        errorMessage={formError}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
