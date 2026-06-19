interface AdminOrdersPaginationProps {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
}

export function AdminOrdersPagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
}: AdminOrdersPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-neutral-600 sm:text-base">
        전체 {totalCount.toLocaleString('ko-KR')}건 중 {from.toLocaleString('ko-KR')}-
        {to.toLocaleString('ko-KR')}건
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
        >
          이전
        </button>
        <span className="min-w-20 text-center text-sm text-neutral-700 sm:text-base">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
        >
          다음
        </button>
      </div>
    </div>
  )
}
