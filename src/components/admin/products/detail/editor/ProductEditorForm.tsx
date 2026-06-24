import type { ReactNode } from 'react'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import { ImagesTab } from '../ImagesTab'
import { ProductBasicInfoSection } from '../sections/ProductBasicInfoSection'
import { ProductDetailImagesSection } from '../sections/ProductDetailImagesSection'
import { ProductPricingSection } from '../sections/ProductPricingSection'
import type { ProductEditorSectionId } from './productEditorSections'

interface ProductEditorFormProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

interface EditorSectionProps {
  id: ProductEditorSectionId
  step: number
  title: string
  children: ReactNode
}

function EditorSection({ id, step, title, children }: EditorSectionProps) {
  return (
    <section
      id={`editor-section-${id}`}
      data-editor-section
      data-section-id={id}
      className="scroll-mt-28 border-b border-neutral-200 pb-12 last:border-0"
    >
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
          {step}
        </span>
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function ProductEditorForm({ form, onChange }: ProductEditorFormProps) {
  const tabProps = { form, onChange }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <EditorSection id="photos" step={1} title="상품 사진">
        <ImagesTab {...tabProps} />
      </EditorSection>

      <EditorSection id="name" step={2} title="상품명">
        <ProductBasicInfoSection {...tabProps} />
      </EditorSection>

      <EditorSection id="pricing" step={3} title="가격/재고">
        <ProductPricingSection {...tabProps} />
      </EditorSection>

      <EditorSection id="details" step={4} title="상세 이미지">
        <ProductDetailImagesSection {...tabProps} />
      </EditorSection>
    </div>
  )
}
