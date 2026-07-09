import type { CartItem } from '../types/cart'
import { formatProductOptionLabel, formatSelectedOptionsLabel } from './productVariants'

function serializeSelectedOptions(selectedOptions?: Record<string, string>): string {
  if (!selectedOptions) {
    return ''
  }

  return Object.entries(selectedOptions)
    .sort(([left], [right]) => left.localeCompare(right, 'ko'))
    .map(([name, value]) => `${name}=${value}`)
    .join('|')
}

export function buildCartLineId(
  productId: string,
  color?: string,
  size?: string,
  selectedOptions?: Record<string, string>,
): string {
  const serializedOptions = serializeSelectedOptions(selectedOptions)
  if (serializedOptions) {
    return `${productId}::${serializedOptions}`
  }

  const normalizedColor = color?.trim() ?? ''
  const normalizedSize = size?.trim() ?? ''

  if (!normalizedColor && !normalizedSize) {
    return productId
  }

  return `${productId}::${normalizedColor}::${normalizedSize}`
}

export function getCartLineId(item: CartItem): string {
  return (
    item.cartLineId ??
    buildCartLineId(item.productId, item.selectedColor, item.selectedSize, item.selectedOptions)
  )
}

export function getCartOptionLabel(item: CartItem): string | null {
  if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
    return formatSelectedOptionsLabel(item.selectedOptions)
  }

  return formatProductOptionLabel(item.selectedColor, item.selectedSize)
}
