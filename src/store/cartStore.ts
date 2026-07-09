import type { AddToCartInput, AddToCartOutcome, CartItem } from '../types/cart'
import type { Product } from '../types/product'
import { buildCartLineId, getCartLineId } from '../lib/cartLine'
import { isCartItemAvailable } from '../lib/cartItem'
import {
  findProductVariant,
  findProductVariantByOptions,
  getProductOptionStock,
  hasProductOptions,
  isProductOptionSelectionComplete,
} from '../lib/productVariants'
import { isProductPurchasable } from '../lib/productStock'
import { clampQuantity as clampCartQuantity } from '../utils/sanitize'

export interface AddToCartOptions extends AddToCartInput {}

function clampQuantity(quantity: number, stock: number): number {
  return clampCartQuantity(quantity, stock)
}

function resolveOptionStock(
  product: Product,
  color: string,
  size: string,
  selectedOptions?: Record<string, string>,
): number {
  if (hasProductOptions(product)) {
    return getProductOptionStock(product, color, size, selectedOptions)
  }

  return product.stock
}

export function createCartItemFromProduct(
  product: Product,
  quantity = 1,
  options?: AddToCartOptions,
): CartItem {
  const color = options?.color?.trim() ?? ''
  const size = options?.size?.trim() ?? ''
  const selectedOptions = options?.selectedOptions
  const variant = hasProductOptions(product)
    ? selectedOptions
      ? findProductVariantByOptions(product.variants, selectedOptions)
      : findProductVariant(product.variants, color, size)
    : undefined
  const stock = resolveOptionStock(product, color, size, selectedOptions)

  return {
    cartLineId: buildCartLineId(product.id, color, size, selectedOptions),
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price + (variant?.extraPrice ?? 0),
    thumbnail: product.thumbnail,
    quantity: clampQuantity(quantity, stock),
    stock,
    selectedColor: color || undefined,
    selectedSize: size || undefined,
    selectedOptions,
    optionId: variant?.id,
  }
}

export function normalizeCartItems(items: CartItem[]): CartItem[] {
  const byLineId = new Map<string, CartItem>()

  for (const item of items) {
    const lineId = getCartLineId(item)
    const normalizedItem = { ...item, cartLineId: lineId }
    const existing = byLineId.get(lineId)

    if (!existing) {
      const quantity =
        normalizedItem.stock > 0
          ? clampQuantity(normalizedItem.quantity, normalizedItem.stock)
          : normalizedItem.quantity

      if (quantity > 0) {
        byLineId.set(lineId, { ...normalizedItem, quantity })
      }
      continue
    }

    const stock = Math.max(existing.stock, normalizedItem.stock)

    if (stock === 0) {
      byLineId.set(lineId, {
        ...existing,
        name: normalizedItem.name,
        slug: normalizedItem.slug,
        price: normalizedItem.price,
        thumbnail: normalizedItem.thumbnail,
        stock: 0,
        quantity: existing.quantity + normalizedItem.quantity,
        selectedColor: normalizedItem.selectedColor ?? existing.selectedColor,
        selectedSize: normalizedItem.selectedSize ?? existing.selectedSize,
        selectedOptions: normalizedItem.selectedOptions ?? existing.selectedOptions,
        optionId: normalizedItem.optionId ?? existing.optionId,
      })
      continue
    }

    const quantity = clampQuantity(existing.quantity + normalizedItem.quantity, stock)

    if (quantity > 0) {
      byLineId.set(lineId, {
        ...existing,
        name: normalizedItem.name,
        slug: normalizedItem.slug,
        price: normalizedItem.price,
        thumbnail: normalizedItem.thumbnail,
        stock,
        quantity,
        selectedColor: normalizedItem.selectedColor ?? existing.selectedColor,
        selectedSize: normalizedItem.selectedSize ?? existing.selectedSize,
        selectedOptions: normalizedItem.selectedOptions ?? existing.selectedOptions,
        optionId: normalizedItem.optionId ?? existing.optionId,
      })
    }
  }

  return [...byLineId.values()]
}

export function addToCart(
  items: CartItem[],
  product: Product,
  options?: AddToCartOptions,
): AddToCartOutcome {
  if (!isProductPurchasable(product)) {
    return { items, result: product.stock <= 0 ? 'soldOut' : 'notAvailable' }
  }

  const color = options?.color?.trim() ?? ''
  const size = options?.size?.trim() ?? ''
  const selectedOptions = options?.selectedOptions
  const quantity = options?.quantity ?? 1

  if (
    hasProductOptions(product) &&
    !isProductOptionSelectionComplete(product, color, size, selectedOptions)
  ) {
    return { items, result: 'optionRequired' }
  }

  const stock = resolveOptionStock(product, color, size, selectedOptions)

  if (stock <= 0) {
    return { items, result: 'soldOut' }
  }

  const lineId = buildCartLineId(product.id, color, size, selectedOptions)
  const existing = items.find((item) => getCartLineId(item) === lineId)

  if (existing && existing.quantity + quantity > stock) {
    return { items, result: 'alreadyMaxQuantity' }
  }

  if (existing) {
    return {
      items: normalizeCartItems(
        items.map((item) => {
          if (getCartLineId(item) !== lineId) {
            return item
          }

          return createCartItemFromProduct(product, item.quantity + quantity, {
            color,
            size,
            selectedOptions,
          })
        }),
      ),
      result: 'success',
    }
  }

  return {
    items: normalizeCartItems([
      ...items,
      createCartItemFromProduct(product, quantity, { color, size, selectedOptions }),
    ]),
    result: 'success',
  }
}

export function removeFromCart(items: CartItem[], cartLineId: string): CartItem[] {
  return items.filter((item) => getCartLineId(item) !== cartLineId)
}

export function updateQuantity(
  items: CartItem[],
  cartLineId: string,
  quantity: number,
): CartItem[] {
  return normalizeCartItems(
    items.map((item) => {
      if (getCartLineId(item) !== cartLineId) {
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
