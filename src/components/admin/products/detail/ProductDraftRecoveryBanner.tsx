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

/** "오후 10:01 임시저장 완료" → "오후 10:01" */
function formatSavedAtPhrase(savedAtLabel: string): string {
  const trimmed = savedAtLabel.replace(/\s*임시저장 완료\s*$/u, '').trim()
  return trimmed || savedAtLabel
}

export function ProductDraftRecoveryBanner({
  mode: _mode,
  savedAtLabel,
  isStale,
  pendingLocalImages,
  onContinue,
  onDiscard,
}: ProductDraftRecoveryBannerProps) {
  const savedAtPhrase = formatSavedAtPhrase(savedAtLabel)

  return (
    <div
      role="dialog"
      aria-labelledby="product-draft-recovery-title"
      className="mb-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5 text-sm text-neutral-800 sm:mb-4 sm:px-4 sm:py-3"
    >
      <p id="product-draft-recovery-title" className="text-sm font-semibold text-neutral-900">
        작성 중이던 상품이 있어요
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 sm:mt-1">
        마지막 작성 내용이 {savedAtPhrase}에 자동 저장되었어요.
      </p>
      {isStale && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500 sm:mt-2 sm:text-xs">
          저장된 상품이 더 최근에 수정되었을 수 있어요. 불러올 내용을 확인해 주세요.
        </p>
      )}
      {pendingLocalImages && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500 sm:mt-2 sm:text-xs">
          선택한 새 이미지 파일은 페이지를 닫으면 다시 선택해야 할 수 있습니다.
        </p>
      )}

      <div className="mt-2.5 flex flex-col gap-1.5 sm:mt-3 sm:flex-row sm:flex-wrap sm:gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="h-9 rounded-xl bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800 sm:h-10 sm:px-4 sm:text-sm"
        >
          이어서 작성하기
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 sm:h-10 sm:px-4 sm:text-sm"
        >
          새로 작성하기
        </button>
      </div>
    </div>
  )
}
