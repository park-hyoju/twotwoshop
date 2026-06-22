interface ProductDetailNoticeProps {
  children: string
}

export function ProductDetailNotice({ children }: ProductDetailNoticeProps) {
  return (
    <p className="rounded-xl bg-neutral-50 px-4 py-3.5 text-sm leading-6 text-neutral-600">
      {children}
    </p>
  )
}
