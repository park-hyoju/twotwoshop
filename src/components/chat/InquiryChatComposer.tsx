import type { KeyboardEvent, ReactNode } from 'react'

interface InquiryChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isSubmitting?: boolean
  placeholder?: string
  errorMessage?: string | null
  accessory?: ReactNode
  sendLabel?: string
  onAttachClick?: () => void
  showAttachButton?: boolean
}

export function InquiryChatComposer({
  value,
  onChange,
  onSend,
  isSubmitting = false,
  placeholder = '메시지를 입력하세요',
  errorMessage = null,
  accessory,
  sendLabel = '전송',
  onAttachClick,
  showAttachButton = false,
}: InquiryChatComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!isSubmitting && value.trim()) {
        onSend()
      }
    }
  }

  return (
    <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-3">
      {accessory}
      <div className="flex min-w-0 items-end gap-2">
        {showAttachButton && onAttachClick && (
          <button
            type="button"
            onClick={onAttachClick}
            disabled={isSubmitting}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg transition-colors hover:bg-neutral-50 disabled:opacity-50"
            aria-label="사진 첨부"
          >
            📎
          </button>
        )}
        <textarea
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSubmitting}
          className="max-h-28 min-h-[44px] min-w-0 flex-1 resize-none rounded-2xl border border-neutral-200 bg-[#f7f7f7] px-3 py-2.5 text-[14px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={isSubmitting || !value.trim()}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '...' : sendLabel}
        </button>
      </div>
      {errorMessage && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
