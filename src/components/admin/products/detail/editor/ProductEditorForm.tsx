import type { ReactNode } from 'react'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import { ImagesTab } from '../ImagesTab'
import { ShippingTab } from '../ShippingTab'
import { adminPageStackClassName } from '../adminFormStyles'
import { BasicInfoSection } from '../sections/BasicInfoSection'
import { PricingSection } from '../sections/PricingSection'
import { ProductAdvancedSettingsSection } from '../sections/ProductAdvancedSettingsSection'
import { SimpleDescriptionSection } from '../sections/SimpleDescriptionSection'
import { ProductEditorLivePreview } from './ProductEditorLivePreview'
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
      className="scroll-mt-24"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
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
    <div className={adminPageStackClassName}>
      <EditorSection id="photos" step={1} title="상품사진">
        <ImagesTab {...tabProps} />
      </EditorSection>

      <EditorSection id="info" step={2} title="상품정보">
        <BasicInfoSection {...tabProps} hidePricingCard simple />
      </EditorSection>

      <EditorSection id="pricing" step={3} title="가격/재고">
        <PricingSection {...tabProps} />
      </EditorSection>

      <EditorSection id="description" step={4} title="상세설명">
        <SimpleDescriptionSection {...tabProps} />
      </EditorSection>

      <EditorSection id="shipping" step={5} title="배송/교환">
        <ShippingTab {...tabProps} />
      </EditorSection>

      <EditorSection id="preview" step={6} title="미리보기">
        <div className="xl:hidden">
          <ProductEditorLivePreview form={form} compact />
        </div>
        <p className="mt-2 hidden text-sm text-neutral-500 xl:block">
          큰 화면에서는 오른쪽에서 바로 확인할 수 있어요.
        </p>
      </EditorSection>

      <ProductAdvancedSettingsSection {...tabProps} />
    </div>
  )
}
