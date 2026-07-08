import { Link, useLocation } from 'react-router-dom'
import { ADMIN_UNAUTHORIZED_MESSAGE } from '../lib/adminAuthConfig'
import { ROUTES } from '../lib/routes'

interface ForbiddenLocationState {
  message?: string
}

export function ForbiddenPage() {
  const location = useLocation()
  const state = location.state as ForbiddenLocationState | null
  const message = state?.message ?? ADMIN_UNAUTHORIZED_MESSAGE

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">접근 권한이 없습니다</h1>
      <p className="mt-4 text-lg text-neutral-600 sm:text-xl">{message}</p>
      <Link
        to={ROUTES.home}
        className="mt-8 inline-flex min-h-14 items-center justify-center rounded-xl bg-neutral-900 px-8 text-lg font-semibold text-white transition-colors hover:bg-neutral-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
