export function AdminInquirySidebarSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[20px] border border-neutral-100 bg-white p-3"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="h-4 w-24 animate-pulse rounded-lg bg-neutral-200" />
          <div className="mt-2 h-3 w-full animate-pulse rounded bg-neutral-100" />
          <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  )
}
