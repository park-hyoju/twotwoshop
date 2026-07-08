import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import {
  calculateDiscountRate,
  calculateDiscountRateForStorage,
} from '../../../../../lib/calculateDiscountRate'
import { adminInputClassName, adminLabelClassName } from '../adminFormStyles'

interface ProductPricingSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function ProductPricingSection({ form, onChange }: ProductPricingSectionProps) {
  const discountRate = calculateDiscountRate(form.original_price, form.price)

  function handlePriceChange(value: number) {
    onChange('price', value)
    onChange('discount_rate', calculateDiscountRateForStorage(form.original_price, value))
  }

  function handleOriginalPriceChange(value: number) {
    onChange('original_price', value)
    onChange('discount_rate', calculateDiscountRateForStorage(value, form.price))
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="pricing-sale-price" className={adminLabelClassName}>
            판매가
          </label>
          <input
            id="pricing-sale-price"
            type="number"
            min={0}
            value={form.price}
            onChange={(event) => handlePriceChange(Number(event.target.value))}
            className={adminInputClassName}
          />
        </div>

        <div>
          <label htmlFor="pricing-original-price" className={adminLabelClassName}>
            정가
          </label>
          <input
            id="pricing-original-price"
            type="number"
            min={0}
            value={form.original_price}
            onChange={(event) => handleOriginalPriceChange(Number(event.target.value))}
            className={adminInputClassName}
          />
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <p className={adminLabelClassName}>자동 할인율</p>
          <div
            className={`${adminInputClassName} flex items-center bg-neutral-50 text-neutral-800`}
            aria-live="polite"
          >
            {discountRate !== null ? `자동 할인율 ${discountRate}%` : '할인 없음'}
          </div>
        </div>

        <div>
          <label htmlFor="pricing-stock" className={adminLabelClassName}>
            재고 수량
          </label>
          <input
            id="pricing-stock"
            type="number"
            min={0}
            value={form.stock}
            onChange={(event) => onChange('stock', Number(event.target.value))}
            className={adminInputClassName}
          />
        </div>
      </div>
    </div>
  )
}
