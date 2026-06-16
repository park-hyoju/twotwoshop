import type { Benefit } from '../../types/benefit'

interface BenefitCardProps {
  benefit: Benefit
}

export function BenefitCard({ benefit }: BenefitCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white px-6 py-10 text-center shadow-sm transition-shadow hover:shadow-md">
      <span className="text-5xl sm:text-6xl" aria-hidden="true">
        {benefit.icon}
      </span>
      <h3 className="mt-5 text-xl font-bold text-neutral-900 sm:text-2xl">
        {benefit.title}
      </h3>
      <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
        {benefit.description}
      </p>
    </article>
  )
}
