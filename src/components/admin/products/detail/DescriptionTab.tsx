import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'
import { adminSectionClassName } from './adminFormStyles'
import { ProductDescriptionEditor } from './sections/ProductDescriptionEditor'
import { ProductDetailMediaSection } from './sections/ProductDetailMediaSection'

interface DescriptionTabProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function DescriptionTab({ form, onChange }: DescriptionTabProps) {
  return (
    <div className="space-y-6">
      <div className={`${adminSectionClassName} space-y-4`}>
        <ProductDescriptionEditor
          value={form.description}
          shortDescription={form.short_description}
          onChange={(value) => onChange('description', value)}
        />
      </div>

      <div className={adminSectionClassName}>
        <ProductDetailMediaSection form={form} onChange={onChange} />
      </div>
    </div>
  )
}
