import type { CartItem } from '../types/cart'

const CART_STORAGE_KEY = 'twotwoshop-cart'

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.productId === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    typeof item.thumbnail === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.stock === 'number'
  )
}

export function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isCartItem)
  } catch {
    return []
  }
}

export function saveCartToStorage(items: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}
