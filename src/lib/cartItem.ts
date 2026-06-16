import type { CartItem } from '../types/cart'

export function isCartItemAvailable(item: CartItem): boolean {
  return item.stock > 0
}

export function isCartItemSoldOut(item: CartItem): boolean {
  return item.stock === 0
}
