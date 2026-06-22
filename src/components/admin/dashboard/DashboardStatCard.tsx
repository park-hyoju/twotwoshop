interface DashboardStatCardProps {
  label: string
  value: string
  emphasize?: boolean
}

export function DashboardStatCard({ label, value, emphasize = false }: DashboardStatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm sm:p-5 ${
        emphasize
          ? 'border-amber-300 bg-amber-50'
          : 'border-neutral-200 bg-white'
      }`}
    >
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${
          emphasize ? 'text-amber-900' : 'text-neutral-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
