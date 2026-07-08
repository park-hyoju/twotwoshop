import type { ProductSellerStep } from '../../../../types/adminProductDetail'
import { PRODUCT_SELLER_STEPS } from './productSellerSteps'

interface ProductSellerStepNavProps {
  activeStep: ProductSellerStep
  onStepChange: (step: ProductSellerStep) => void
}

export function ProductSellerStepNav({ activeStep, onStepChange }: ProductSellerStepNavProps) {
  return (
    <nav aria-label="상품 등록 단계" className="border-b border-neutral-200 bg-white px-4 sm:px-6">
      <ol className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto py-3">
        {PRODUCT_SELLER_STEPS.map((step) => {
          const isActive = step.id === activeStep

          return (
            <li key={step.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isActive ? 'bg-white text-neutral-900' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {step.step}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
