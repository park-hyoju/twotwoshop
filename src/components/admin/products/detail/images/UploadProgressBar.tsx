interface UploadProgressBarProps {
  label: string
  progress: number
}

export function UploadProgressBar({ label, progress }: UploadProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-neutral-600">
        <span className="truncate">{label}</span>
        <span className="font-medium tabular-nums">{clampedProgress}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-neutral-900 transition-[width] duration-200"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}
