export function AdminInquiriesListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="hidden overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm md:block">
        <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 px-4 py-4">
              <div className="col-span-1 h-4 animate-pulse rounded bg-neutral-200" />
              <div className="col-span-2 h-4 animate-pulse rounded bg-neutral-200" />
              <div className="col-span-2 h-4 animate-pulse rounded bg-neutral-200" />
              <div className="col-span-2 h-4 animate-pulse rounded bg-neutral-200" />
              <div className="col-span-3 h-4 animate-pulse rounded bg-neutral-200" />
              <div className="col-span-2 h-4 animate-pulse rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="h-5 w-24 animate-pulse rounded bg-neutral-200" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-200" />
            </div>
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-neutral-200" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
