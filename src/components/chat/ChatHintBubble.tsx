import type { ReactNode } from 'react'

interface ChatHintBubbleProps {
  children: ReactNode
}

export function ChatHintBubble({ children }: ChatHintBubbleProps) {
  return (
    <div className="admin-animate-in flex items-end gap-2">
      <div className="w-8 shrink-0" />
      <div className="max-w-[85%] rounded-[20px] rounded-bl-md bg-neutral-100 px-4 py-3 text-[14px] leading-relaxed text-neutral-600 transition-all duration-300">
        {children}
      </div>
    </div>
  )
}
