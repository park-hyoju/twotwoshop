import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import { adminCardClassName, adminSectionTitleClassName } from '../adminFormStyles'
import { AdminPricingFields } from './AdminPricingFields'

interface PricingSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function PricingSection({ form, onChange }: PricingSectionProps) {
  return (
      <section className={adminCardClassName}>
      <h3 className={`${adminSectionTitleClassName} mb-6`}>가격과 재고</h3>
      <AdminPricingFields form={form} onChange={onChange} showSoldOutToggle />
    </section>
  )
}
