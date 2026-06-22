import type { ProductDetailEditorStep } from './productDetailSteps'
import { PRODUCT_DETAIL_STEPS } from './productDetailSteps'

interface ProductDetailSidebarProps {
  activeStep: ProductDetailEditorStep
  onStepChange: (step: ProductDetailEditorStep) => void
}

export function ProductDetailSidebar({ activeStep, onStepChange }: ProductDetailSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block">
      <div className="sticky top-0 px-4 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          상품 수정
        </p>
        <nav aria-label="상품 수정 단계" className="space-y-1">
          {PRODUCT_DETAIL_STEPS.map((step) => {
            const isActive = activeStep === step.id

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {step.step}
                </span>
                <span className="text-sm font-semibold">{step.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
