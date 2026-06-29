import type { ReactNode } from 'react'
import { ChatBrandAvatar } from './ChatBrandAvatar'

interface ChatBotBubbleProps {
  children: ReactNode
  showAvatar?: boolean
  authorName?: string
  className?: string
}

export function ChatBotBubble({
  children,
  showAvatar = true,
  authorName = '투투',
  className = '',
}: ChatBotBubbleProps) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      {showAvatar ? <ChatBrandAvatar size="sm" /> : <div className="w-8 shrink-0" />}
      <div className="min-w-0 max-w-[85%]">
        {showAvatar && authorName && (
          <p className="mb-1 text-xs font-semibold text-neutral-500">{authorName}</p>
        )}
        <div className="rounded-[20px] rounded-bl-md bg-white px-4 py-3.5 text-[15px] leading-relaxed text-neutral-800 shadow-[0_2px_12px_rgba(15,23,42,0.08)] transition-all duration-300">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ChatUserBubbleProps {
  children: ReactNode
  className?: string
}

export function ChatUserBubble({ children, className = '' }: ChatUserBubbleProps) {
  return (
    <div className={`flex justify-end ${className}`}>
      <div className="max-w-[85%] rounded-[20px] rounded-br-md bg-neutral-900 px-4 py-3 text-[15px] font-medium leading-relaxed text-white shadow-[0_2px_12px_rgba(15,23,42,0.12)] transition-all duration-300">
        {children}
      </div>
    </div>
  )
}
