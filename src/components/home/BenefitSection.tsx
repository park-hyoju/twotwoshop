import { Section } from '../common/Section'
import { BenefitCard } from './BenefitCard'
import type { Benefit } from '../../types/benefit'

interface BenefitSectionProps {
  benefits: Benefit[]
}

export function BenefitSection({ benefits }: BenefitSectionProps) {
  return (
    <Section ariaLabel="고객 혜택" className="bg-neutral-50">
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {benefits.map((benefit) => (
          <li key={benefit.id}>
            <BenefitCard benefit={benefit} />
          </li>
        ))}
      </ul>
    </Section>
  )
}
