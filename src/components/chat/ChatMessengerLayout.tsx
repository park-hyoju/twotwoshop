import { ChatBrandAvatar } from './ChatBrandAvatar'
import { CHAT_SCROLL_CLASSNAME } from './chatMessengerStyles'

interface ChatMessengerLayoutProps {
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  scrollable?: boolean
}

export function ChatMessengerLayout({
  onClose,
  children,
  footer,
  scrollable = true,
}: ChatMessengerLayoutProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-neutral-100 bg-white px-5 py-4">
        <div className="flex items-start gap-3">
          <ChatBrandAvatar size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-neutral-900">🐰 투투샵 고객센터</p>
            <p className="mt-1.5 text-[13px] leading-snug text-neutral-600">
              안녕하세요! 투투샵 고객센터입니다.
              <br />
              <br />
              문의는 언제든 편하게 남겨주세요 :)
              <br />
              <br />
              24시간 이내 확인 후 순차적으로 답변드릴게요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors duration-200 hover:bg-neutral-100 hover:text-neutral-700"
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
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden overflow-x-hidden bg-[#f4f5f7]">
        {scrollable ? (
          <div className={CHAT_SCROLL_CLASSNAME}>{children}</div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
        )}
        {footer}
      </div>
    </div>
  )
}
