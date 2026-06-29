import { ChatBrandAvatar } from './ChatBrandAvatar'

export function ChatTypingIndicator() {
  return (
    <div className="admin-animate-in flex items-end gap-2">
      <ChatBrandAvatar size="sm" />
      <div className="min-w-0">
        <p className="mb-1 text-xs font-semibold text-neutral-500">투투</p>
        <div className="rounded-[20px] rounded-bl-md bg-white px-4 py-3 shadow-[0_2px_12px_rgba(15,23,42,0.08)]">
          <p className="text-[14px] leading-relaxed text-neutral-600">
            투투가 답변을 준비하고 있어요...
          </p>
          <div className="mt-2 flex items-center gap-1" aria-hidden="true">
            <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-rose-300" />
            <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-amber-300 [animation-delay:0.15s]" />
            <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-rose-300 [animation-delay:0.3s]" />
          </div>
        </div>
      </div>
    </div>
  )
}
