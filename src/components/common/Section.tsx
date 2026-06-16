import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { LAYOUT } from '../../lib/constants/layout'

interface SectionProps {
  id?: string
  ariaLabel: string
  className?: string
  children: ReactNode
}

export function Section({ id, ariaLabel, className, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(LAYOUT.sectionY, className)}
    >
      <div className={LAYOUT.container}>{children}</div>
    </section>
  )
}
