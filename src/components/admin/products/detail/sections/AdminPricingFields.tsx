import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { ProductStatus } from '../../../../../types/status'
import { adminInputClassName, adminLabelClassName } from '../adminFormStyles'

interface AdminPricingFieldsProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
  showSoldOutToggle?: boolean
}

function computeDiscountRate(price: number, originalPrice: number): number {
  if (originalPrice <= 0 || price <= 0 || price >= originalPrice) {
    return 0
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

export function AdminPricingFields({
  form,
  onChange,
  showSoldOutToggle = false,
}: AdminPricingFieldsProps) {
  const isSoldOut = form.status === 'soldout'
  const discountRate = computeDiscountRate(form.price, form.original_price)

  function handlePriceChange(value: number) {
    onChange('price', value)
    onChange('discount_rate', computeDiscountRate(value, form.original_price))
  }

  function handleOriginalPriceChange(value: number) {
    onChange('original_price', value)
    onChange('discount_rate', computeDiscountRate(form.price, value))
  }

  function handleSoldOutToggle(checked: boolean) {
    const nextStatus: ProductStatus = checked ? 'soldout' : 'active'
    onChange('status', nextStatus)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
      <div>
        <label htmlFor="detail-price" className={adminLabelClassName}>
          판매가
        </label>
        <input
          id="detail-price"
          type="number"
          min={0}
          value={form.price}
          onChange={(event) => handlePriceChange(Number(event.target.value))}
          className={adminInputClassName}
        />
      </div>
      <div>
        <label htmlFor="detail-original-price" className={adminLabelClassName}>
          소비자가
        </label>
        <input
          id="detail-original-price"
          type="number"
          min={0}
          value={form.original_price}
          onChange={(event) => handleOriginalPriceChange(Number(event.target.value))}
          className={adminInputClassName}
        />
      </div>
      <div>
        <label htmlFor="detail-discount-rate" className={adminLabelClassName}>
          할인율
        </label>
        <div
          id="detail-discount-rate"
          className={`${adminInputClassName} flex items-center bg-neutral-50 text-neutral-700`}
        >
          {discountRate > 0 ? `${discountRate}%` : '할인 없음'}
        </div>
      </div>
      <div>
        <label htmlFor="detail-stock" className={adminLabelClassName}>
          재고
        </label>
        <input
          id="detail-stock"
          type="number"
          min={0}
          value={form.stock}
          onChange={(event) => onChange('stock', Number(event.target.value))}
          className={adminInputClassName}
        />
      </div>

      {showSoldOutToggle && (
        <div className="flex items-center gap-3 md:col-span-2">
          <input
            id="detail-sold-out"
            type="checkbox"
            checked={isSoldOut}
            onChange={(event) => handleSoldOutToggle(event.target.checked)}
            className="h-5 w-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
          <label htmlFor="detail-sold-out" className="text-sm font-semibold text-neutral-700">
            품절로 표시
          </label>
        </div>
      )}
    </div>
  )
}
