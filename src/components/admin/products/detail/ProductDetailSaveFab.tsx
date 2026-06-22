interface ProductDetailSaveFabProps {
  disabled: boolean
  isSaving: boolean
  onSave: () => void
}

export function ProductDetailSaveFab({ disabled, isSaving, onSave }: ProductDetailSaveFabProps) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={disabled}
      className="fixed bottom-6 right-6 z-[60] flex h-14 min-w-[5.5rem] items-center justify-center rounded-full bg-neutral-900 px-6 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 lg:bottom-8 lg:right-8"
    >
      {isSaving ? '저장 중' : '저장'}
    </button>
  )
}
