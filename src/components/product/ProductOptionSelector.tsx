import { useMemo } from 'react'
import type { Product } from '../../types/product'
import {
  findProductVariantByOptions,
  formatSelectedOptionsLabel,
  getOptionValuesForGroup,
  getProductOptionGroups,
  getProductOptionStock,
  hasProductOptions,
  isProductOptionSelectionComplete,
} from '../../lib/productVariants'

interface ProductOptionSelectorProps {
  product: Product
  selectedOptions: Record<string, string>
  quantity: number
  onOptionChange: (optionName: string, value: string) => void
  onQuantityChange: (quantity: number) => void
}

function OptionButton({
  label,
  selected,
  disabled,
  soldOut,
  onClick,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  soldOut?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || soldOut}
      className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
        selected
          ? 'border-neutral-900 bg-neutral-900 text-white'
          : soldOut
            ? 'border-neutral-200 bg-neutral-100 text-neutral-400 line-through'
            : 'border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500'
      }`}
    >
      {soldOut ? `${label} 품절` : label}
    </button>
  )
}

export function ProductOptionSelector({
  product,
  selectedOptions,
  quantity,
  onOptionChange,
  onQuantityChange,
}: ProductOptionSelectorProps) {
  const hasOptions = hasProductOptions(product)
  const optionGroups = useMemo(() => getProductOptionGroups(product), [product])

  const selectedStock = hasOptions
    ? getProductOptionStock(product, '', '', selectedOptions)
    : product.stock

  const selectedVariant = hasOptions
    ? findProductVariantByOptions(product.variants, selectedOptions)
    : undefined

  const maxQuantity = Math.max(selectedStock, 0)
  const selectionLabel = formatSelectedOptionsLabel(selectedOptions)
  const selectionComplete = isProductOptionSelectionComplete(product, '', '', selectedOptions)

  if (!hasOptions) {
    return (
      <div>
        <p className="mb-3 text-sm font-semibold text-neutral-700">수량</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-300 text-lg font-semibold disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-8 text-center text-lg font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
            disabled={quantity >= maxQuantity}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-300 text-lg font-semibold disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {optionGroups.map((group, groupIndex) => {
        const values = getOptionValuesForGroup(
          product.variants,
          group.name,
          selectedOptions,
          optionGroups,
        )
        const priorGroups = optionGroups.slice(0, groupIndex)
        const priorSelected = priorGroups.every((prior) => selectedOptions[prior.name])

        return (
          <div key={group.name}>
            <p className="mb-3 text-sm font-semibold text-neutral-700">{group.name}</p>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const nextOptions = { ...selectedOptions, [group.name]: value }
                const stock = getProductOptionStock(product, '', '', nextOptions)
                const laterGroups = optionGroups.slice(groupIndex + 1)
                const hasLaterStock = laterGroups.length
                  ? product.variants.some(
                      (variant) =>
                        Object.entries(nextOptions).every(
                          ([name, optionValue]) => variant.options[name] === optionValue,
                        ) && variant.stock > 0,
                    )
                  : stock > 0

                return (
                  <OptionButton
                    key={`${group.name}-${value}`}
                    label={value}
                    selected={selectedOptions[group.name] === value}
                    soldOut={!hasLaterStock}
                    disabled={!priorSelected}
                    onClick={() => onOptionChange(group.name, value)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      <div>
        <p className="mb-3 text-sm font-semibold text-neutral-700">수량</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || maxQuantity <= 0 || !selectionComplete}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-300 text-lg font-semibold disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-8 text-center text-lg font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
            disabled={maxQuantity <= 0 || quantity >= maxQuantity || !selectionComplete}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-300 text-lg font-semibold disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      {selectionLabel && selectedStock > 0 && selectionComplete && (
        <div className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <p className="font-semibold text-neutral-900">선택한 옵션</p>
          <p className="mt-1">
            {selectionLabel} / 수량 {quantity}
          </p>
        </div>
      )}

      {selectedVariant && selectedStock <= 0 && selectionComplete && (
        <p className="text-sm font-medium text-red-600">선택한 옵션은 품절입니다.</p>
      )}
    </div>
  )
}
