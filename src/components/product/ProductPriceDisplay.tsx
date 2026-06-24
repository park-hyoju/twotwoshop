import { formatPrice } from '../../lib/formatPrice'
import { calculateDiscountRate } from '../../lib/calculateDiscountRate'

interface ProductPriceDisplayProps {
  originalPrice: number
  salePrice: number
  size?: 'card' | 'detail'
}

export function ProductPriceDisplay({
  originalPrice,
  salePrice,
  size = 'card',
}: ProductPriceDisplayProps) {
  const discountRate = calculateDiscountRate(originalPrice, salePrice)
  const hasDiscount = discountRate !== null

  const salePriceClassName =
    size === 'detail'
      ? 'text-3xl font-bold text-neutral-900 sm:text-4xl'
      : 'text-xl font-bold text-neutral-900 sm:text-2xl'

  const discountClassName =
    size === 'detail' ? 'text-lg font-bold text-red-600' : 'text-base font-bold text-red-600 sm:text-lg'

  const originalClassName =
    size === 'detail' ? 'text-lg text-neutral-400 line-through' : 'text-sm text-neutral-400 line-through sm:text-base'

  if (!hasDiscount) {
    return <p className={salePriceClassName}>{formatPrice(salePrice)}</p>
  }

  return (
    <div className={size === 'detail' ? 'space-y-2' : 'space-y-1'}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={discountClassName}>{discountRate}%</span>
        <span className={salePriceClassName}>{formatPrice(salePrice)}</span>
      </div>
      <p className={originalClassName}>{formatPrice(originalPrice)}</p>
    </div>
  )
}
