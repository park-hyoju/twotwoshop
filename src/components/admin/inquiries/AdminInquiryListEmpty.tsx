interface AdminInquiryListEmptyProps {
  hasActiveFilters: boolean
  onReset?: () => void
}

export function AdminInquiryListEmpty({ hasActiveFilters, onReset }: AdminInquiryListEmptyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="text-4xl">📭</div>
      <p className="mt-3 text-sm font-semibold text-neutral-800">문의가 없습니다</p>
      <p className="mt-1 text-xs leading-5 text-neutral-500">
        {hasActiveFilters
          ? '검색 조건을 변경하거나 초기화해 보세요.'
          : '새 문의가 들어오면 여기에 표시됩니다.'}
      </p>
      {hasActiveFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 rounded-2xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
        >
          필터 초기화
        </button>
      )}
    </div>
  )
}
