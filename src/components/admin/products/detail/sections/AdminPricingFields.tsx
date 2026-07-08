import {
  calculateDiscountRate,
  calculateDiscountRateForStorage,
  calculateSalePriceFromDiscount,
} from '../../../../../lib/calculateDiscountRate'
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
  operator?: boolean
}

export function AdminPricingFields({
  form,
  onChange,
  showSoldOutToggle = false,
  operator = false,
}: AdminPricingFieldsProps) {
  const isSoldOut = form.status === 'soldout'
  const autoDiscountRate = calculateDiscountRate(form.original_price, form.price)

  function handlePriceChange(value: number) {
    onChange('price', value)
    onChange('discount_rate', calculateDiscountRateForStorage(form.original_price, value))
  }

  function handleOriginalPriceChange(value: number) {
    onChange('original_price', value)
    onChange('discount_rate', calculateDiscountRateForStorage(value, form.price))
  }

  function handleDiscountRateChange(value: number) {
    const nextDiscountRate = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0
    onChange('discount_rate', nextDiscountRate)

    if (form.original_price > 0 && nextDiscountRate > 0 && nextDiscountRate < 100) {
      onChange('price', calculateSalePriceFromDiscount(form.original_price, nextDiscountRate))
    }
  }

  function handleSoldOutToggle(checked: boolean) {
    const nextStatus: ProductStatus = checked ? 'soldout' : 'active'
    onChange('status', nextStatus)
  }

  if (operator) {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="detail-original-price" className={adminLabelClassName}>
              정가
            </label>
            <input
              id="detail-original-price"
              type="number"
              min={0}
              value={form.original_price || ''}
              onChange={(event) => handleOriginalPriceChange(Number(event.target.value))}
              className={adminInputClassName}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="detail-price" className={adminLabelClassName}>
              판매가
            </label>
            <input
              id="detail-price"
              type="number"
              min={0}
              value={form.price || ''}
              onChange={(event) => handlePriceChange(Number(event.target.value))}
              className={adminInputClassName}
              placeholder="0"
            />
          </div>
        </div>

        {autoDiscountRate !== null ? (
          <div
            className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
            aria-live="polite"
          >
            ↓ {autoDiscountRate}% 할인
          </div>
        ) : (
          <p className="text-sm text-neutral-500" aria-live="polite">
            할인 없음
          </p>
        )}

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
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
      <div>
        <label htmlFor="detail-original-price" className={adminLabelClassName}>
          정가
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
        <label htmlFor="detail-discount-rate" className={adminLabelClassName}>
          할인율 (%)
        </label>
        <input
          id="detail-discount-rate"
          type="number"
          min={0}
          max={100}
          value={form.discount_rate}
          onChange={(event) => handleDiscountRateChange(Number(event.target.value))}
          className={adminInputClassName}
        />
        <p className="mt-1 text-xs text-neutral-500" aria-live="polite">
          {autoDiscountRate !== null
            ? `자동 계산: ${autoDiscountRate}%`
            : '정가가 없거나 정가 이하 판매가면 할인 없음'}
        </p>
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
