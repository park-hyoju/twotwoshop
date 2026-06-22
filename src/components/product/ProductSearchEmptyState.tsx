interface ProductSearchEmptyStateProps {
  query: string
  onRetry: () => void
}

export function ProductSearchEmptyState({ query, onRetry }: ProductSearchEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-neutral-900 sm:text-xl">
        &apos;{query}&apos;에 대한 검색 결과가 없습니다.
      </p>
      <p className="mt-3 text-base text-neutral-600 sm:text-lg">
        검색어를 다시 확인하거나 다른 키워드로 검색해보세요.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-base font-medium text-neutral-800 transition-colors hover:bg-neutral-100"
      >
        다시 검색하기
      </button>
    </div>
  )
}
