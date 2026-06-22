import { DashboardHeader } from './DashboardHeader'

export function DashboardLoadingState() {
  return (
    <div>
      <DashboardHeader />
      <div className="mt-8 rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-neutral-700 sm:text-lg">
          운영 현황을 불러오는 중입니다.
        </p>
        <p className="mt-2 text-sm text-neutral-500 sm:text-base">
          주문과 상품 정보를 준비하고 있습니다.
        </p>
      </div>
    </div>
  )
}
