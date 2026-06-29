export function ChatBrandAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClassName = size === 'sm' ? 'h-8 w-8 text-base' : 'h-11 w-11 text-xl'

  return (
    <div
      className={`${sizeClassName} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-rose-50 to-pink-100 shadow-sm ring-2 ring-white`}
      aria-hidden="true"
    >
      🐰
    </div>
  )
}
