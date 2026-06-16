import type { AddToCartOutcome, CartItem } from '../types/cart'
import type { Product } from '../types/product'
import { isCartItemAvailable } from '../lib/cartItem'

function clampQuantity(quantity: number, stock: number): number {
  if (stock <= 0) {
    return 0
  }

  return Math.max(1, Math.min(quantity, stock))
}

export function normalizeCartItems(items: CartItem[]): CartItem[] {
  const byProductId = new Map<string, CartItem>()

  for (const item of items) {
    const existing = byProductId.get(item.productId)

    if (!existing) {
      const quantity =
        item.stock > 0 ? clampQuantity(item.quantity, item.stock) : item.quantity

      if (quantity > 0) {
        byProductId.set(item.productId, { ...item, quantity })
      }
      continue
    }

    const stock = Math.max(existing.stock, item.stock)

    if (stock === 0) {
      byProductId.set(item.productId, {
        ...existing,
        name: item.name,
        slug: item.slug,
        price: item.price,
        thumbnail: item.thumbnail,
        stock: 0,
        quantity: existing.quantity + item.quantity,
      })
      continue
    }

    const quantity = clampQuantity(existing.quantity + item.quantity, stock)

    if (quantity > 0) {
      byProductId.set(item.productId, {
        ...existing,
        name: item.name,
        slug: item.slug,
        price: item.price,
        thumbnail: item.thumbnail,
        stock,
        quantity,
      })
    }
  }

  return [...byProductId.values()]
}

export function createCartItemFromProduct(product: Product, quantity = 1): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    thumbnail: product.thumbnail,
    quantity: clampQuantity(quantity, product.stock),
    stock: product.stock,
  }
}

export function addToCart(items: CartItem[], product: Product): AddToCartOutcome {
  if (product.status === 'hidden') {
    return { items, result: 'notAvailable' }
  }

  if (product.stock === 0) {
    return { items, result: 'soldOut' }
  }

  const existing = items.find((item) => item.productId === product.id)

  if (existing && existing.quantity >= product.stock) {
    return { items, result: 'alreadyMaxQuantity' }
  }

  if (existing) {
    return {
      items: normalizeCartItems(
        items.map((item) => {
          if (item.productId !== product.id) {
            return item
          }

          return {
            ...item,
            slug: product.slug,
            name: product.name,
            price: product.price,
            thumbnail: product.thumbnail,
            stock: product.stock,
            quantity: clampQuantity(item.quantity + 1, product.stock),
          }
        }),
      ),
      result: 'success',
    }
  }

  return {
    items: normalizeCartItems([...items, createCartItemFromProduct(product, 1)]),
    result: 'success',
  }
}

export function removeFromCart(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.productId !== productId)
}

export function updateQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
): CartItem[] {
  return normalizeCartItems(
    items.map((item) => {
      if (item.productId !== productId) {
        return item
      }

      if (item.stock === 0) {
        return item
      }

      return {
        ...item,
        quantity: clampQuantity(quantity, item.stock),
      }
    }),
  )
}

export function clearCart(): CartItem[] {
  return []
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    if (!isCartItemAvailable(item)) {
      return total
    }

    return total + item.price * item.quantity
  }, 0)
}

export function getCartCount(items: CartItem[]): number {
  return items.reduce((count, item) => {
    if (!isCartItemAvailable(item)) {
      return count
    }

    return count + item.quantity
  }, 0)
}

export function getCartTotalQuantity(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0)
}

export function getSoldOutCount(items: CartItem[]): number {
  return items.reduce((count, item) => {
    if (isCartItemAvailable(item)) {
      return count
    }

    return count + item.quantity
  }, 0)
}

export function hasSoldOutItems(items: CartItem[]): boolean {
  return items.some((item) => !isCartItemAvailable(item))
}
