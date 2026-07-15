import { ChatBotBubble } from './ChatBubble'
import {
  CHAT_PRIMARY_BUTTON_CLASSNAME,
  CHAT_SECONDARY_BUTTON_CLASSNAME,
} from './chatMessengerStyles'

interface InquirySuccessViewProps {
  onLookup: () => void
  onClose: () => void
}

export function InquirySuccessView({ onLookup, onClose }: InquirySuccessViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <ChatBotBubble>
        <p className="font-semibold text-neutral-900">문의가 접수되었습니다.</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          남겨주신 연락처로 답변 안내드릴게요.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          상담창에서 이름과 연락처로 문의 내역을 다시 확인할 수 있습니다.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          문의는 순차적으로 확인 후 답변드리고 있습니다.
        </p>
      </ChatBotBubble>

      <div className="ml-0 flex flex-col gap-2 sm:ml-10">
        <button type="button" onClick={onLookup} className={CHAT_PRIMARY_BUTTON_CLASSNAME}>
          내 문의 확인하기
        </button>
        <button type="button" onClick={onClose} className={CHAT_SECONDARY_BUTTON_CLASSNAME}>
          닫기
        </button>
      </div>
    </div>
  )
}
