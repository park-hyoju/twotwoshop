import type { AdminProductDraftMode } from '../../../../lib/adminProductDraftStorage'

interface ProductDraftRecoveryBannerProps {
  mode: AdminProductDraftMode
  savedAtLabel: string
  isStale: boolean
  pendingLocalImages: boolean
  onContinue: () => void
  onDiscard: () => void
  onOpenDatabase?: () => void
}

export function ProductDraftRecoveryBanner({
  mode,
  savedAtLabel,
  isStale,
  pendingLocalImages,
  onContinue,
  onDiscard,
  onOpenDatabase,
}: ProductDraftRecoveryBannerProps) {
  return (
    <div
      role="dialog"
      aria-labelledby="product-draft-recovery-title"
      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p id="product-draft-recovery-title" className="font-semibold">
        저장하지 않은 상품 작업이 남아 있습니다.
      </p>
      <p className="mt-1 text-xs text-amber-800">{savedAtLabel}</p>
      {isStale && (
        <p className="mt-2 text-xs text-amber-900">
          임시저장이 DB 상품 수정 시각보다 오래되었습니다. 다른 관리자 저장분과 충돌할 수 있습니다.
        </p>
      )}
      {pendingLocalImages && (
        <p className="mt-2 text-xs text-amber-900">
          선택한 새 이미지 파일은 페이지를 닫으면 다시 선택해야 할 수 있습니다.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="h-9 rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800"
        >
          이어서 작성
        </button>
        {mode === 'create' ? (
          <button
            type="button"
            onClick={onDiscard}
            className="h-9 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100"
          >
            새로 작성
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onDiscard}
              className="h-9 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100"
            >
              임시저장 삭제
            </button>
            <button
              type="button"
              onClick={onOpenDatabase ?? onDiscard}
              className="h-9 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100"
            >
              현재 DB 데이터로 열기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
