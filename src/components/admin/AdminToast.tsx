import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const TOAST_DURATION_MS = 2500

interface AdminToastContextValue {
  showToast: (message: string) => void
  dismissToast: () => void
}

interface ActiveToast {
  id: number
  message: string
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null)

function AdminToastViewport({
  toast,
  onDismiss,
}: {
  toast: ActiveToast | null
  onDismiss: () => void
}) {
  if (!toast) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:top-6 sm:justify-end sm:px-0">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-neutral-900 px-4 py-3.5 text-white shadow-lg ring-1 ring-black/10"
      >
        <span
          aria-hidden
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold"
        >
          ✓
        </span>
        <p className="flex-1 text-sm font-medium leading-6">{toast.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="알림 닫기"
        >
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>
      </div>
    </div>
  )
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null)
  const dismissTimerRef = useRef<number | null>(null)
  const toastIdRef = useRef(0)

  const dismissToast = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }

    setToast(null)
  }, [])

  const showToast = useCallback(
    (message: string) => {
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current)
      }

      toastIdRef.current += 1
      setToast({ id: toastIdRef.current, message })

      dismissTimerRef.current = window.setTimeout(() => {
        dismissTimerRef.current = null
        setToast(null)
      }, TOAST_DURATION_MS)
    },
    [],
  )

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current)
      }
    }
  }, [])

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast],
  )

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <AdminToastViewport toast={toast} onDismiss={dismissToast} />
    </AdminToastContext.Provider>
  )
}

export function useAdminToast(): AdminToastContextValue {
  const context = useContext(AdminToastContext)

  if (!context) {
    throw new Error('useAdminToast must be used within AdminToastProvider')
  }

  return context
}
