const QUICK_INQUIRIES = [
  { label: '배송문의', icon: '📦' },
  { label: '상품문의', icon: '👕' },
  { label: '결제문의', icon: '💳' },
  { label: '교환 / 환불', icon: '🚚' },
  { label: '직접 문의하기', icon: '✍️' },
] as const

interface ChatWindowProps {
  onClose: () => void
}

export function ChatWindow({ onClose }: ChatWindowProps) {
  return (
    <div
      className="flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:w-96"
      role="dialog"
      aria-label="사이트 채팅 상담"
    >
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-900 px-4 py-4 sm:px-5">
        <div>
          <p className="text-base font-bold text-white sm:text-lg">투투샵 상담</p>
          <p className="text-sm text-neutral-300">평일 09:00 ~ 18:00</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="채팅창 닫기"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex max-h-[60vh] flex-1 flex-col gap-5 overflow-y-auto p-4 sm:max-h-none sm:p-5">
        <div className="rounded-2xl bg-neutral-100 px-4 py-4">
          <p className="text-base font-medium text-neutral-900 sm:text-lg">
            안녕하세요 😊
          </p>
          <p className="mt-2 text-base text-neutral-600 sm:text-lg">
            무엇을 도와드릴까요?
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {QUICK_INQUIRIES.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex min-h-12 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 text-left text-base font-medium text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 active:bg-neutral-100 sm:min-h-14 sm:text-lg"
            >
              <span className="text-xl" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
