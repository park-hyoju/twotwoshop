interface AdminOrdersResetModalProps {
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function AdminOrdersResetModal({
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminOrdersResetModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-orders-reset-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-xl">
          ⚠️
        </div>
        <h2 id="admin-orders-reset-title" className="mt-4 text-lg font-bold text-neutral-900">
          테스트 주문 초기화
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          모든 주문과 주문 상품 데이터가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          정말 진행하시겠습니까?
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
            {isSubmitting ? '삭제 중...' : '전체 삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
