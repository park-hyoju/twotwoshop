import type { CartItem } from '../types/cart'
import { formatProductOptionLabel } from './productVariants'

export function buildCartLineId(productId: string, color?: string, size?: string): string {
  const normalizedColor = color?.trim() ?? ''
  const normalizedSize = size?.trim() ?? ''

  if (!normalizedColor && !normalizedSize) {
    return productId
  }

  return `${productId}::${normalizedColor}::${normalizedSize}`
}

export function getCartLineId(item: CartItem): string {
  return item.cartLineId ?? buildCartLineId(item.productId, item.selectedColor, item.selectedSize)
}

export function getCartOptionLabel(item: CartItem): string | null {
  return formatProductOptionLabel(item.selectedColor, item.selectedSize)
}
