interface AdminInquiriesEmptyStateProps {
  hasActiveFilters: boolean
  onReset?: () => void
}

export function AdminInquiriesEmptyState({
  hasActiveFilters,
  onReset,
}: AdminInquiriesEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-gradient-to-b from-white to-neutral-50 px-6 py-16 text-center shadow-sm">
      <div className="max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl">
          💬
        </div>
        <h3 className="mt-4 text-lg font-bold text-neutral-900">접수된 문의가 없습니다</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          {hasActiveFilters
            ? '검색 조건에 맞는 문의가 없습니다. 필터를 초기화하고 다시 확인해 주세요.'
            : '고객 문의가 접수되면 이곳에서 실시간으로 확인할 수 있습니다.'}
        </p>
        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="mt-5 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            필터 초기화
          </button>
        )}
      </div>
    </div>
  )
}
