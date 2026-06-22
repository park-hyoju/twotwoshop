import type { AdminProductDetailForm, AdminProductInfoFields } from '../../../../types/adminProductDetail'
import { adminInputClassName, adminLabelClassName } from './adminFormStyles'

interface ProductInfoTabProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

const PRODUCT_INFO_FIELDS: Array<{ key: keyof AdminProductInfoFields; label: string }> = [
  { key: 'material', label: '소재' },
  { key: 'origin_country', label: '제조국' },
  { key: 'manufacturer', label: '제조사' },
  { key: 'care_instructions', label: '세탁방법' },
  { key: 'thickness', label: '두께감' },
  { key: 'stretch', label: '신축성' },
  { key: 'sheer', label: '비침' },
  { key: 'lining', label: '안감' },
  { key: 'fit', label: '핏' },
]

export function ProductInfoTab({ form, onChange }: ProductInfoTabProps) {
  function updateField(key: keyof AdminProductInfoFields, value: string) {
    onChange('product_info', { ...form.product_info, [key]: value })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {PRODUCT_INFO_FIELDS.map((field) => (
        <div key={field.key}>
          <label htmlFor={`product-info-${field.key}`} className={adminLabelClassName}>
            {field.label}
          </label>
          <input
            id={`product-info-${field.key}`}
            value={form.product_info[field.key]}
            onChange={(event) => updateField(field.key, event.target.value)}
            className={adminInputClassName}
          />
        </div>
      ))}
    </div>
  )
}
