import { useMemo } from 'react'
import type { Product } from '../../types/product'
import {
  findProductVariant,
  formatProductOptionLabel,
  getProductColors,
  getProductOptionStock,
  getProductSizes,
  hasProductOptions,
  requiresColorSelection,
  requiresSizeSelection,
} from '../../lib/productVariants'

interface ProductOptionSelectorProps {
  product: Product
  selectedColor: string
  selectedSize: string
  quantity: number
  onColorChange: (color: string) => void
  onSizeChange: (size: string) => void
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
  selectedColor,
  selectedSize,
  quantity,
  onColorChange,
  onSizeChange,
  onQuantityChange,
}: ProductOptionSelectorProps) {
  const hasOptions = hasProductOptions(product)
  const colors = useMemo(() => getProductColors(product.variants), [product.variants])
  const sizes = useMemo(
    () => getProductSizes(product.variants, selectedColor || undefined),
    [product.variants, selectedColor],
  )

  const selectedStock = hasOptions
    ? getProductOptionStock(product, selectedColor, selectedSize)
    : product.stock

  const selectedVariant =
    hasOptions && selectedColor && selectedSize
      ? findProductVariant(product.variants, selectedColor, selectedSize)
      : undefined

  const maxQuantity = Math.max(selectedStock, 0)
  const selectionLabel = formatProductOptionLabel(selectedColor, selectedSize)

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
      {requiresColorSelection(product.variants) && (
        <div>
          <p className="mb-3 text-sm font-semibold text-neutral-700">색상</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const colorStock = getProductSizes(product.variants, color).some((size) => {
                const variant = findProductVariant(product.variants, color, size)
                return (variant?.stock ?? 0) > 0
              })

              return (
                <OptionButton
                  key={color}
                  label={color}
                  selected={selectedColor === color}
                  soldOut={!colorStock}
                  onClick={() => {
                    onColorChange(color)
                    onSizeChange('')
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {requiresSizeSelection(product.variants) && (
        <div>
          <p className="mb-3 text-sm font-semibold text-neutral-700">사이즈</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const stock = getProductOptionStock(
                product,
                selectedColor || colors[0] || '',
                size,
              )

              return (
                <OptionButton
                  key={size}
                  label={size}
                  selected={selectedSize === size}
                  soldOut={stock <= 0}
                  disabled={requiresColorSelection(product.variants) && !selectedColor}
                  onClick={() => onSizeChange(size)}
                />
              )
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-semibold text-neutral-700">수량</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || maxQuantity <= 0}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-300 text-lg font-semibold disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-8 text-center text-lg font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
            disabled={maxQuantity <= 0 || quantity >= maxQuantity}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-300 text-lg font-semibold disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      {selectionLabel && selectedStock > 0 && (
        <div className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <p className="font-semibold text-neutral-900">선택한 옵션</p>
          <p className="mt-1">
            {selectionLabel} / 수량 {quantity}
          </p>
        </div>
      )}

      {selectedVariant && selectedStock <= 0 && (
        <p className="text-sm font-medium text-red-600">선택한 옵션은 품절입니다.</p>
      )}
    </div>
  )
}
