interface CartSyncNoticesProps {
  notices: string[]
  onDismiss?: () => void
}

export function CartSyncNotices({ notices, onDismiss }: CartSyncNoticesProps) {
  if (notices.length === 0) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
    >
      <p className="text-base font-semibold text-amber-900 sm:text-lg">장바구니 안내</p>
      <ul className="mt-3 space-y-2 text-base text-amber-900 sm:text-lg">
        {notices.map((notice) => (
          <li key={notice}>• {notice}</li>
        ))}
      </ul>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 min-h-11 rounded-xl border border-amber-300 bg-white px-4 text-base font-semibold text-amber-900 transition-colors hover:bg-amber-100"
        >
          확인
        </button>
      )}
    </div>
  )
}
