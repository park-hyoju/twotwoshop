import type { ConsultationStatus } from '../../types/consultationStatus'
import { DEFAULT_CHAT_SUPPORT_POLICY } from '../../lib/chatSupportPolicy'
import { getConsultationStatusLine, getConsultationStatusOption } from '../../lib/consultationStatusDisplay'
import { ChatBrandAvatar } from './ChatBrandAvatar'
import { CHAT_SCROLL_CLASSNAME } from './chatMessengerStyles'

interface ChatMessengerLayoutProps {
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  scrollable?: boolean
  consultationStatus: ConsultationStatus
}

export function ChatMessengerLayout({
  onClose,
  children,
  footer,
  scrollable = true,
  consultationStatus,
}: ChatMessengerLayoutProps) {
  const statusOption = getConsultationStatusOption(consultationStatus)

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-neutral-100 bg-white px-5 py-4">
        <div className="flex items-start gap-3">
          <ChatBrandAvatar size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-neutral-900">투투샵 상담</p>
            <p className="mt-0.5 text-[12px] font-medium text-neutral-500">쇼핑 도우미 투투</p>
            <p className={`mt-1.5 text-[13px] leading-snug ${statusOption.toneClass}`}>
              {getConsultationStatusLine(consultationStatus)}
            </p>
            <p className="mt-1 text-[12px] text-neutral-400">
              운영시간 {DEFAULT_CHAT_SUPPORT_POLICY.operatingHours.label}
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
