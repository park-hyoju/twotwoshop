interface ChatButtonProps {
  onClick: () => void
  isOpen: boolean
}

export function ChatButton({ onClick, isOpen }: ChatButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-14 items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-neutral-700 hover:shadow-xl active:scale-95 sm:px-6 sm:text-lg"
      aria-label={isOpen ? '상담창 닫기' : '상담하기'}
      aria-expanded={isOpen}
    >
      <span aria-hidden="true">💬</span>
      상담하기
    </button>
  )
}
