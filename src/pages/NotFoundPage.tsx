import { Link } from 'react-router-dom'
import { ROUTES } from '../lib/routes'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">페이지를 찾을 수 없습니다</h1>
      <p className="mt-4 text-lg text-neutral-600 sm:text-xl">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        to={ROUTES.home}
        className="mt-8 inline-flex min-h-14 items-center justify-center rounded-xl bg-neutral-900 px-8 text-lg font-semibold text-white transition-colors hover:bg-neutral-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
