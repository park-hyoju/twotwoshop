import { CHAT_ACTION_BUTTON_CLASSNAME } from './chatMessengerStyles'

interface ChatActionFooterProps {
  onResolved: () => void
  onAdditionalInquiry: () => void
}

export function ChatActionFooter({ onResolved, onAdditionalInquiry }: ChatActionFooterProps) {
  return (
    <footer className="shrink-0 border-t border-neutral-200/80 bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onResolved}
          className={`${CHAT_ACTION_BUTTON_CLASSNAME} border border-neutral-200 bg-[#f8f9fb] text-neutral-700 hover:bg-neutral-100`}
        >
          <span aria-hidden="true">👍</span>
          해결됐어요
        </button>
        <button
          type="button"
          onClick={onAdditionalInquiry}
          className={`${CHAT_ACTION_BUTTON_CLASSNAME} bg-neutral-900 text-white shadow-md hover:bg-neutral-800`}
        >
          <span aria-hidden="true">💬</span>
          추가 문의하기
        </button>
      </div>
    </footer>
  )
}
