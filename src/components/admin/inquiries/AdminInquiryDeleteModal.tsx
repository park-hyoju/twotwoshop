interface AdminInquiryDeleteModalProps {
  isOpen: boolean
  count: number
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function AdminInquiryDeleteModal({
  isOpen,
  count,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminInquiryDeleteModalProps) {
  if (!isOpen) {
    return null
  }

  const title = count > 1 ? `${count}건의 문의를 삭제` : '문의 삭제'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-inquiry-delete-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-xl">
          🗑️
        </div>
        <h2 id="admin-inquiry-delete-title" className="mt-4 text-lg font-bold text-neutral-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          정말 삭제하시겠습니까? 삭제한 문의는 복구할 수 없습니다.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
