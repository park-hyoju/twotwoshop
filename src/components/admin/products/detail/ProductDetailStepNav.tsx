import type { ProductDetailEditorStep } from './productDetailSteps'
import { PRODUCT_DETAIL_STEPS } from './productDetailSteps'

interface ProductDetailStepNavProps {
  activeStep: ProductDetailEditorStep
  onStepChange: (step: ProductDetailEditorStep) => void
}

export function ProductDetailStepNav({ activeStep, onStepChange }: ProductDetailStepNavProps) {
  return (
    <nav
      aria-label="상품 수정 단계"
      className="border-b border-neutral-200 bg-white lg:hidden"
    >
      <div className="flex gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PRODUCT_DETAIL_STEPS.map((step) => {
          const isActive = activeStep === step.id

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange(step.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              <span className="text-xs opacity-80">{step.step}</span>
              <span>{step.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
