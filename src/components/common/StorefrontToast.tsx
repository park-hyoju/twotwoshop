import { useEffect } from 'react'

interface StorefrontToastProps {
  message: string
  onDismiss: () => void
}

export function StorefrontToast({ message, onDismiss }: StorefrontToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss()
    }, 3500)

    return () => window.clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      className="admin-animate-in fixed bottom-6 left-1/2 z-50 w-[min(92vw,360px)] -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm font-medium leading-6 text-neutral-800">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800"
          aria-label="알림 닫기"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
