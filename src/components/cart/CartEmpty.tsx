import { Link } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'

export function CartEmpty() {
  return (
    <div className="rounded-2xl bg-neutral-100 px-6 py-16 text-center">
      <p className="text-xl font-semibold text-neutral-800 sm:text-2xl">장바구니가 비어 있습니다.</p>
      <p className="mt-3 text-base text-neutral-600 sm:text-lg">
        원하시는 상품을 담아보세요.
      </p>
      <Link
        to={ROUTES.products}
        className="mt-8 inline-flex min-h-14 items-center justify-center rounded-xl bg-neutral-900 px-8 text-lg font-semibold text-white transition-colors hover:bg-neutral-700"
      >
        상품 보러가기
      </Link>
    </div>
  )
}
