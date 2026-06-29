import { CHAT_QUICK_INQUIRIES, type ChatInquiryQuickKey } from '../../lib/chatInquiryTypes'
import { CHAT_INQUIRY_BUTTON_CLASSNAME } from './chatMessengerStyles'

interface ChatQuickReplyListProps {
  onSelect: (key: ChatInquiryQuickKey) => void
  disabled?: boolean
}

export function ChatQuickReplyList({ onSelect, disabled = false }: ChatQuickReplyListProps) {
  return (
    <div className="flex flex-col gap-2">
      {CHAT_QUICK_INQUIRIES.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item.key)}
          className={CHAT_INQUIRY_BUTTON_CLASSNAME}
        >
          <span className="text-base leading-none" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
