interface ChatButtonProps {
  onClick: () => void
  isOpen: boolean
}

export function ChatButton({ onClick, isOpen }: ChatButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex min-h-14 items-center gap-2.5 rounded-full bg-neutral-900 px-5 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,0.28)] transition-all duration-300 hover:bg-neutral-800 hover:shadow-[0_12px_32px_rgba(15,23,42,0.32)] active:scale-95 sm:px-6"
      aria-label={isOpen ? '상담창 닫기' : '상담하기'}
      aria-expanded={isOpen}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg transition-transform duration-300 group-hover:scale-110"
        aria-hidden="true"
      >
        💬
      </span>
      상담하기
    </button>
  )
}
