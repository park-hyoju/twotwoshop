import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import { adminInputClassName, adminLabelClassName } from '../adminFormStyles'

interface SellerShippingStepProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function SellerShippingStep({ form, onChange }: SellerShippingStepProps) {
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

  return (
    <div className="space-y-5">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-800">
        <input
          type="checkbox"
          checked={isFreeShipping}
          onChange={(event) => handleFreeShippingToggle(event.target.checked)}
          className="h-5 w-5 rounded border-neutral-300"
        />
        무료배송
      </label>

      <div>
        <label htmlFor="seller-shipping-fee" className={adminLabelClassName}>
          배송비
        </label>
        <input
          id="seller-shipping-fee"
          value={isFreeShipping ? '0' : form.shipping_info.shipping_fee}
          onChange={(event) =>
            onChange('shipping_info', { ...form.shipping_info, shipping_fee: event.target.value })
          }
          disabled={isFreeShipping}
          placeholder="예) 3000"
          className={adminInputClassName}
        />
      </div>

      <div>
        <label htmlFor="seller-delivery-period" className={adminLabelClassName}>
          출고일
        </label>
        <input
          id="seller-delivery-period"
          value={form.shipping_info.delivery_period}
          onChange={(event) =>
            onChange('shipping_info', {
              ...form.shipping_info,
              delivery_period: event.target.value,
            })
          }
          placeholder="예) 결제 후 1~2일 이내 출고"
          className={adminInputClassName}
        />
      </div>
    </div>
  )
}
