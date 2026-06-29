import { cn } from '../../lib/cn'

interface SectionTitleProps {
  title: string
  description?: string
  className?: string
}

export function SectionTitle({ title, description, className }: SectionTitleProps) {
  return (
    <div className={cn('text-center sm:text-left', className)}>
      <h2 className="text-xl font-semibold tracking-tight text-[#111] sm:text-2xl">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-[#888] sm:text-base">{description}</p>
      )}
    </div>
  )
}
