import { getChatAutoGuideMessage } from '../../lib/chatAutoGuideMessages'
import { getQuickInquiryLabel, type ChatInquiryQuickKey } from '../../lib/chatInquiryTypes'
import { ChatBotBubble, ChatUserBubble } from './ChatBubble'

interface ChatGuideConversationProps {
  quickKey: ChatInquiryQuickKey
}

export function ChatGuideConversation({ quickKey }: ChatGuideConversationProps) {
  return (
    <div className="flex flex-col gap-4 transition-opacity duration-300">
      <ChatUserBubble>{getQuickInquiryLabel(quickKey)}</ChatUserBubble>
      <ChatBotBubble>
        <p className="whitespace-pre-wrap">{getChatAutoGuideMessage(quickKey)}</p>
      </ChatBotBubble>
    </div>
  )
}
