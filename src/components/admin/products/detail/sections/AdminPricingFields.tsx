import { useEffect, useState } from 'react'
import {
  calculateDiscountRate,
  calculateDiscountRateForStorage,
  calculateSalePriceFromDiscount,
} from '../../../../../lib/calculateDiscountRate'
import { getDisplayedVariantTotalStock, getVariantTotalStock } from '../../../../../lib/adminProductOptions'
import {
  parseAdminNumericInput,
  pricingDraftFromForm,
  type AdminPricingNumericDraft,
} from '../../../../../lib/adminNumericInput'
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
  onPricingDraftChange?: (draft: AdminPricingNumericDraft) => void
  variantStockDraft?: Record<string, string>
}

export function AdminPricingFields({
  form,
  onChange,
  showSoldOutToggle = false,
  operator = false,
  onPricingDraftChange,
  variantStockDraft,
}: AdminPricingFieldsProps) {
  const [originalPriceInput, setOriginalPriceInput] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [stockInput, setStockInput] = useState('')
  const [discountRateInput, setDiscountRateInput] = useState('')
  const hasOptionVariants = form.variants.length > 0
  const variantTotalStock = hasOptionVariants
    ? getDisplayedVariantTotalStock(form.variants, variantStockDraft ?? {})
    : getVariantTotalStock(form.variants)

  useEffect(() => {
    const draft = pricingDraftFromForm(form)
    setOriginalPriceInput(draft.originalPrice)
    setPriceInput(draft.price)
    setStockInput(draft.stock)
    setDiscountRateInput(draft.discountRate)
    onPricingDraftChange?.(draft)
  }, [form.id, onPricingDraftChange])

  function publishDraft(next: AdminPricingNumericDraft) {
    onPricingDraftChange?.(next)

    // Keep form state in sync so remount / dirty checks / save payload use latest prices.
    const original_price = parseAdminNumericInput(next.originalPrice)
    const price = parseAdminNumericInput(next.price)
    const stock =
      form.variants.length > 0
        ? form.stock
        : parseAdminNumericInput(next.stock)
    const discount_rate = next.discountRate.trim()
      ? parseAdminNumericInput(next.discountRate)
      : calculateDiscountRateForStorage(original_price, price)

    if (form.original_price !== original_price) {
      onChange('original_price', original_price)
    }
    if (form.price !== price) {
      onChange('price', price)
    }
    if (form.variants.length === 0 && form.stock !== stock) {
      onChange('stock', stock)
    }
    if (form.discount_rate !== discount_rate) {
      onChange('discount_rate', discount_rate)
    }
  }

  const parsedOriginalPrice = parseAdminNumericInput(originalPriceInput)
  const parsedPrice = parseAdminNumericInput(priceInput)
  const isSoldOut = form.status === 'soldout'
  const autoDiscountRate = calculateDiscountRate(parsedOriginalPrice, parsedPrice)

  function handleOriginalPriceInputChange(value: string) {
    setOriginalPriceInput(value)
    publishDraft({
      originalPrice: value,
      price: priceInput,
      stock: stockInput,
      discountRate: discountRateInput,
    })
  }

  function handlePriceInputChange(value: string) {
    setPriceInput(value)
    publishDraft({
      originalPrice: originalPriceInput,
      price: value,
      stock: stockInput,
      discountRate: discountRateInput,
    })
  }

  function handleStockInputChange(value: string) {
    setStockInput(value)
    publishDraft({
      originalPrice: originalPriceInput,
      price: priceInput,
      stock: value,
      discountRate: discountRateInput,
    })
  }

  function handleDiscountRateInputChange(value: string) {
    setDiscountRateInput(value)
    const nextDiscountRate = parseAdminNumericInput(value)
    const nextPrice =
      parsedOriginalPrice > 0 && nextDiscountRate > 0 && nextDiscountRate < 100
        ? String(calculateSalePriceFromDiscount(parsedOriginalPrice, nextDiscountRate))
        : priceInput
    if (nextPrice !== priceInput) {
      setPriceInput(nextPrice)
    }
    publishDraft({
      originalPrice: originalPriceInput,
      price: nextPrice,
      stock: stockInput,
      discountRate: value,
    })
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
              value={originalPriceInput}
              onChange={(event) => handleOriginalPriceInputChange(event.target.value)}
              className={adminInputClassName}
              placeholder="정가 입력"
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
              value={priceInput}
              onChange={(event) => handlePriceInputChange(event.target.value)}
              className={adminInputClassName}
              placeholder="판매가 입력"
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
          {hasOptionVariants ? (
            <p className="text-sm font-semibold text-neutral-800" aria-live="polite">
              총 재고 : {variantTotalStock}개 (자동)
            </p>
          ) : (
            <input
              id="detail-stock"
              type="number"
              min={0}
              value={stockInput}
              onChange={(event) => handleStockInputChange(event.target.value)}
              className={adminInputClassName}
              placeholder="재고 입력"
            />
          )}
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
          value={originalPriceInput}
          onChange={(event) => handleOriginalPriceInputChange(event.target.value)}
          className={adminInputClassName}
          placeholder="정가 입력"
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
          value={priceInput}
          onChange={(event) => handlePriceInputChange(event.target.value)}
          className={adminInputClassName}
          placeholder="판매가 입력"
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
          value={discountRateInput}
          onChange={(event) => handleDiscountRateInputChange(event.target.value)}
          className={adminInputClassName}
          placeholder="할인율 입력"
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
        {hasOptionVariants ? (
          <p className="text-sm font-semibold text-neutral-800" aria-live="polite">
            총 재고 : {variantTotalStock}개 (자동)
          </p>
        ) : (
          <input
            id="detail-stock"
            type="number"
            min={0}
            value={stockInput}
            onChange={(event) => handleStockInputChange(event.target.value)}
            className={adminInputClassName}
            placeholder="재고 입력"
          />
        )}
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

export function applyPricingDraftToForm(
  form: AdminProductDetailForm,
  draft: AdminPricingNumericDraft,
): AdminProductDetailForm {
  const original_price = parseAdminNumericInput(draft.originalPrice)
  const price = parseAdminNumericInput(draft.price)
  const stock =
    form.variants.length > 0
      ? getVariantTotalStock(form.variants)
      : parseAdminNumericInput(draft.stock)
  const discount_rate = draft.discountRate.trim()
    ? parseAdminNumericInput(draft.discountRate)
    : calculateDiscountRateForStorage(original_price, price)

  return {
    ...form,
    original_price,
    price,
    stock,
    discount_rate,
  }
}
