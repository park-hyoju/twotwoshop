import type {
  AdminProductDetailForm,
  AdminReturnInfoFields,
  AdminShippingInfoFields,
} from '../../../../types/adminProductDetail'
import { adminInputClassName, adminLabelClassName, adminSectionClassName } from './adminFormStyles'

interface ShippingTabProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

const SHIPPING_FIELDS: Array<{ key: keyof AdminShippingInfoFields; label: string }> = [
  { key: 'shipping_fee', label: '배송비' },
  { key: 'delivery_period', label: '배송기간' },
  { key: 'free_shipping_threshold', label: '무료배송 기준' },
]

const RETURN_FIELDS: Array<{ key: keyof AdminReturnInfoFields; label: string }> = [
  { key: 'exchange_period', label: '교환 가능기간' },
  { key: 'return_address', label: '반품 주소' },
  { key: 'notes', label: '주의사항' },
]

export function ShippingTab({ form, onChange }: ShippingTabProps) {
  function updateShipping(key: keyof AdminShippingInfoFields, value: string) {
    onChange('shipping_info', { ...form.shipping_info, [key]: value })
  }

  function updateReturn(key: keyof AdminReturnInfoFields, value: string) {
    onChange('return_info', { ...form.return_info, [key]: value })
  }

  return (
    <div className="space-y-6">
      <section className={`${adminSectionClassName} grid gap-4 md:grid-cols-2`}>
        <h3 className="md:col-span-2 text-lg font-semibold text-neutral-900">배송 안내</h3>
        {SHIPPING_FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={`shipping-${field.key}`} className={adminLabelClassName}>
              {field.label}
            </label>
            <input
              id={`shipping-${field.key}`}
              value={form.shipping_info[field.key]}
              onChange={(event) => updateShipping(field.key, event.target.value)}
              className={adminInputClassName}
            />
          </div>
        ))}
      </section>

      <section className={`${adminSectionClassName} grid gap-4`}>
        <h3 className="text-lg font-semibold text-neutral-900">교환/환불 안내</h3>
        {RETURN_FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={`return-${field.key}`} className={adminLabelClassName}>
              {field.label}
            </label>
            {field.key === 'notes' ? (
              <textarea
                id={`return-${field.key}`}
                value={form.return_info[field.key]}
                onChange={(event) => updateReturn(field.key, event.target.value)}
                rows={4}
                className={`${adminInputClassName} resize-y`}
              />
            ) : (
              <input
                id={`return-${field.key}`}
                value={form.return_info[field.key]}
                onChange={(event) => updateReturn(field.key, event.target.value)}
                className={adminInputClassName}
              />
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
