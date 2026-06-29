import { Link } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'

export function ProductSearchEmptyState() {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-14 text-center sm:px-10 sm:py-16">
      <div className="text-4xl sm:text-5xl" aria-hidden="true">
        🔍
      </div>
      <p className="mt-5 text-xl font-semibold text-neutral-900 sm:text-2xl">
        찾으시는 상품이 없습니다.
      </p>
      <p className="mt-3 text-base text-[#6B7280] sm:text-lg">
        다른 검색어를 입력하거나 카테고리를 둘러보세요.
      </p>
      <Link
        to={ROUTES.products}
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-neutral-900 px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-neutral-800"
      >
        전체 상품 보기
      </Link>
    </div>
  )
}
