import { useEffect, useRef, useState } from 'react'
import { getChatAutoGuideMessage } from '../../lib/chatAutoGuideMessages'
import { getQuickInquiryLabel, type ChatInquiryQuickKey } from '../../lib/chatInquiryTypes'
import { ChatBotBubble } from './ChatBubble'
import { ChatTypingIndicator } from './ChatTypingIndicator'
import { InquiryForm } from './InquiryForm'
import { CHAT_PRIMARY_BUTTON_CLASSNAME } from './chatMessengerStyles'

const AUTO_REPLY_DELAY_MS = 1500

interface ChatComposeViewProps {
  quickKey: ChatInquiryQuickKey
  onBack: () => void
  onSuccess: () => void
}

export function ChatComposeView({ quickKey, onBack, onSuccess }: ChatComposeViewProps) {
  const [isBotTyping, setIsBotTyping] = useState(true)
  const [autoReplyMessage, setAutoReplyMessage] = useState('')
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const replyTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setIsBotTyping(true)
    setAutoReplyMessage('')
    setShowInquiryForm(false)

    if (replyTimerRef.current !== null) {
      window.clearTimeout(replyTimerRef.current)
    }

    replyTimerRef.current = window.setTimeout(() => {
      setIsBotTyping(false)
      setAutoReplyMessage(getChatAutoGuideMessage(quickKey))
    }, AUTO_REPLY_DELAY_MS)

    return () => {
      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current)
        replyTimerRef.current = null
      }
    }
  }, [quickKey])

  const showAdditionalInquiryButton = autoReplyMessage.length > 0 && !showInquiryForm

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex shrink-0 items-center gap-1 self-start rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-neutral-600 shadow-sm transition-colors duration-200 hover:text-neutral-900"
      >
        <span aria-hidden="true">←</span>
        문의 유형 다시 선택
      </button>

      <div
        className={`space-y-3 overflow-y-auto overscroll-contain [scrollbar-width:thin] ${
          showInquiryForm
            ? 'max-h-[min(200px,30vh)] shrink-0 border-b border-neutral-200/70 pb-3'
            : 'min-h-0 flex-1'
        }`}
      >
        {isBotTyping && <ChatTypingIndicator />}
        {autoReplyMessage && (
          <ChatBotBubble className="admin-animate-in">
            <p className="whitespace-pre-wrap">{autoReplyMessage}</p>
          </ChatBotBubble>
        )}
        {showAdditionalInquiryButton && (
          <div className="admin-animate-in ml-0 pt-1 sm:ml-10">
            <button
              type="button"
              onClick={() => setShowInquiryForm(true)}
              className={`${CHAT_PRIMARY_BUTTON_CLASSNAME} gap-2 shadow-md`}
            >
              <span aria-hidden="true">💬</span>
              추가 문의하기
            </button>
          </div>
        )}
      </div>

      {showInquiryForm && (
        <div className="admin-animate-in flex min-h-0 flex-1 flex-col overflow-hidden pt-3">
          <p className="mb-2 shrink-0 px-1 text-xs font-medium text-neutral-500">
            선택한 문의 · {getQuickInquiryLabel(quickKey)}
          </p>
          <InquiryForm quickKey={quickKey} onSuccess={onSuccess} layout="chat" />
        </div>
      )}
    </div>
  )
}
