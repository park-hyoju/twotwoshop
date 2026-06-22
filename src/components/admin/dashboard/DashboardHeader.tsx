import { formatDashboardTodayLabel } from '../../../lib/adminDashboardCalendar'

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">대시보드</h1>
        <p className="mt-2 text-base text-neutral-600 sm:text-lg">
          오늘 쇼핑몰 운영 현황을 확인하세요.
        </p>
      </div>
      <p className="shrink-0 text-sm font-medium text-neutral-500 sm:text-base">
        {formatDashboardTodayLabel()}
      </p>
    </div>
  )
}
