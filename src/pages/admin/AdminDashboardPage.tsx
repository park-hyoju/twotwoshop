interface DashboardStatCardProps {
  label: string
  value: string
}

function DashboardStatCard({ label, value }: DashboardStatCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-neutral-500 sm:text-base">{label}</p>
      <p className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl">{value}</p>
    </div>
  )
}

export function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">대시보드</h1>
      <p className="mt-2 text-base text-neutral-600 sm:text-lg">
        투투샵 운영 현황을 한눈에 확인합니다.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="오늘 주문" value="-" />
        <DashboardStatCard label="총 주문" value="-" />
        <DashboardStatCard label="준비 중인 라이브" value="-" />
        <DashboardStatCard label="미응답 문의" value="-" />
      </div>
    </div>
  )
}
