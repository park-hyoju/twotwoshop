import { ArrowRight } from 'lucide-react'
import type { Benefit } from '../../types/benefit'
import { HomeBenefitIcon } from './homeIcons'

interface BenefitCardProps {
  benefit: Benefit
  onAction: (benefit: Benefit) => void
}

export function BenefitCard({ benefit, onAction }: BenefitCardProps) {
  return (
    <button
      type="button"
      onClick={() => onAction(benefit)}
      className="group flex h-full w-full flex-col items-center rounded-[20px] border border-[#eee] bg-white px-6 py-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#ccc] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] sm:px-8 sm:py-12"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fafafa] transition-all duration-300 group-hover:scale-105 group-hover:bg-[#f5f5f5]">
        <HomeBenefitIcon icon={benefit.icon} size={32} className="text-[#111]" />
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-[#111] sm:text-xl">
        {benefit.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[#666] sm:text-[15px]">
        {benefit.description}
      </p>
      <span className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#eee] px-4 text-sm font-medium text-[#111] transition-all duration-300 group-hover:border-[#111] group-hover:bg-[#111] group-hover:text-white">
        {benefit.ctaLabel}
        <ArrowRight
          size={14}
          strokeWidth={1.8}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </button>
  )
}
