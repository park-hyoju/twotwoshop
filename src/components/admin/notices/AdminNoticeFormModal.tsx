import { useEffect, useState } from 'react'
import {
  adminInputClassName,
  adminLabelClassName,
  adminTextareaClassName,
} from '../products/detail/adminFormStyles'
import type { AdminNoticeFormInput, NoticeRow } from '../../../types/notice'

const EMPTY_FORM: AdminNoticeFormInput = {
  title: '',
  content: '',
  is_pinned: false,
  is_active: true,
}

interface AdminNoticeFormModalProps {
  open: boolean
  notice: NoticeRow | null
  isSaving: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (input: AdminNoticeFormInput) => Promise<void>
}

export function AdminNoticeFormModal({
  open,
  notice,
  isSaving,
  errorMessage,
  onClose,
  onSubmit,
}: AdminNoticeFormModalProps) {
  const [form, setForm] = useState<AdminNoticeFormInput>(EMPTY_FORM)
  const [localValidationError, setLocalValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    if (notice) {
      setForm({
        title: notice.title,
        content: notice.content,
        is_pinned: notice.is_pinned,
        is_active: notice.is_active,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setLocalValidationError(null)
  }, [open, notice])

  if (!open) {
    return null
  }

  function updateField<K extends keyof AdminNoticeFormInput>(
    field: K,
    value: AdminNoticeFormInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (form.title.trim().length === 0 || form.content.trim().length === 0) {
      setLocalValidationError('제목과 내용을 모두 입력해주세요.')
      return
    }

    setLocalValidationError(null)
    await onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notice-form-title"
        className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
          <h2 id="notice-form-title" className="text-lg font-bold text-neutral-900 sm:text-xl">
            {notice ? '공지 수정' : '공지 작성'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            닫기
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            {errorMessage && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            {localValidationError && !errorMessage && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {localValidationError}
              </p>
            )}

            <div>
              <label htmlFor="notice-title" className={adminLabelClassName}>
                제목
              </label>
              <input
                id="notice-title"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                className={adminInputClassName}
                placeholder="공지 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label htmlFor="notice-content" className={adminLabelClassName}>
                내용
              </label>
              <textarea
                id="notice-content"
                value={form.content}
                onChange={(event) => updateField('content', event.target.value)}
                rows={12}
                className={`${adminTextareaClassName} resize-y`}
                placeholder="공지 내용을 입력하세요"
                required
              />
            </div>

            <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  disabled={isSaving}
                  onChange={(event) => updateField('is_pinned', event.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                상단 고정
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  disabled={isSaving}
                  onChange={(event) => updateField('is_active', event.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                노출 (고객 페이지에 표시)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={
                isSaving || form.title.trim().length === 0 || form.content.trim().length === 0
              }
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
            >
              {isSaving ? '저장 중...' : notice ? '수정 저장' : '공지 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
