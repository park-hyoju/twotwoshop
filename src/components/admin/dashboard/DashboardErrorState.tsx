import { DashboardHeader } from './DashboardHeader'

interface DashboardErrorStateProps {
  message: string
  onRetry: () => void
}

export function DashboardErrorState({ message, onRetry }: DashboardErrorStateProps) {
  return (
    <div>
      <DashboardHeader />
      <div
        role="alert"
        className="mt-8 rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
      >
        <p className="text-base font-medium text-red-700 sm:text-lg">
          운영 현황을 불러오지 못했습니다.
        </p>
        <p className="mt-2 text-sm text-red-600 sm:text-base">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800 sm:text-base"
        >
          다시 불러오기
        </button>
      </div>
    </div>
  )
}
