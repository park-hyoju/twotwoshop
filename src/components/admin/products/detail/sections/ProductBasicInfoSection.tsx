import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import { adminInputClassName, adminLabelClassName } from '../adminFormStyles'

interface ProductBasicInfoSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function ProductBasicInfoSection({ form, onChange }: ProductBasicInfoSectionProps) {
  return (
    <div>
      <label htmlFor="basic-product-name" className={adminLabelClassName}>
        상품명
      </label>
      <input
        id="basic-product-name"
        value={form.name}
        onChange={(event) => onChange('name', event.target.value)}
        className={adminInputClassName}
        placeholder="예) 오버핏 코튼 셔츠"
      />
    </div>
  )
}
