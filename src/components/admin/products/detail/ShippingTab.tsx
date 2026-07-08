import type {
  AdminProductDetailForm,
  AdminReturnInfoFields,
  AdminShippingInfoFields,
} from '../../../../types/adminProductDetail'
import {
  adminInputClassName,
  adminLabelClassName,
  adminTextareaClassName,
} from './adminFormStyles'

interface ShippingTabProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
  minimal?: boolean
}

const SHIPPING_FIELDS: Array<{ key: keyof AdminShippingInfoFields; label: string }> = [
  { key: 'shipping_fee', label: '배송비' },
  { key: 'delivery_period', label: '배송기간' },
]

const RETURN_FIELDS: Array<{ key: keyof AdminReturnInfoFields; label: string }> = [
  { key: 'exchange_period', label: '교환기간' },
  { key: 'return_address', label: '반품주소' },
  { key: 'notes', label: '유의사항' },
]

export function ShippingTab({ form, onChange, minimal = false }: ShippingTabProps) {
  function updateShipping(key: keyof AdminShippingInfoFields, value: string) {
    onChange('shipping_info', { ...form.shipping_info, [key]: value })
  }

  function updateReturn(key: keyof AdminReturnInfoFields, value: string) {
    onChange('return_info', { ...form.return_info, [key]: value })
  }

  const isFreeShipping =
    form.shipping_info.shipping_fee.trim() === '0' ||
    form.shipping_info.shipping_fee.includes('무료') ||
    form.shipping_info.free_shipping_threshold.includes('무료')

  function handleFreeShippingToggle(checked: boolean) {
    if (checked) {
      onChange('shipping_info', {
        ...form.shipping_info,
        shipping_fee: '0',
        free_shipping_threshold: '무료배송',
      })
      return
    }

    onChange('shipping_info', {
      ...form.shipping_info,
      shipping_fee: '',
      free_shipping_threshold: '',
    })
  }

  const wrapperClassName = minimal ? 'grid gap-8 sm:grid-cols-2' : 'grid gap-6 md:grid-cols-2'

  return (
    <div className="space-y-8">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-800">
        <input
          type="checkbox"
          checked={isFreeShipping}
          onChange={(event) => handleFreeShippingToggle(event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        무료배송
      </label>

      <div className={wrapperClassName}>
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

      {RETURN_FIELDS.map((field) => (
        <div key={field.key} className={field.key === 'notes' ? 'sm:col-span-2' : undefined}>
          <label htmlFor={`return-${field.key}`} className={adminLabelClassName}>
            {field.label}
          </label>
          {field.key === 'notes' ? (
            <textarea
              id={`return-${field.key}`}
              value={form.return_info[field.key]}
              onChange={(event) => updateReturn(field.key, event.target.value)}
              rows={4}
              className={`${adminTextareaClassName} resize-y`}
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
      </div>
    </div>
  )
}
