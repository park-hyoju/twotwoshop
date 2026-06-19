import { Link } from 'react-router-dom'
import { ADMIN_ROUTES } from '../../lib/adminRoutes'
import { ROUTES } from '../../lib/routes'

export function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-neutral-500">TWOTWOSHOP</p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">관리자 로그인</h1>
        <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-base text-neutral-700">
          관리자 로그인 준비 중입니다.
        </p>
        <Link
          to={ADMIN_ROUTES.dashboard}
          className="mt-6 block w-full rounded-xl bg-neutral-900 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          관리자 홈으로 이동
        </Link>
      </div>

      <Link
        to={ROUTES.home}
        className="mt-6 text-base text-neutral-600 transition-colors hover:text-neutral-900"
      >
        ← 쇼핑몰로 돌아가기
      </Link>
    </div>
  )
}
