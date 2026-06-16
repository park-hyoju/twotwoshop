import type { Order, OrderItem, ShippingInfo } from '../types/order'

const ORDER_STORAGE_KEY = 'twotwoshop-latest-order'

function isOrderItem(value: unknown): value is OrderItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.productId === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    typeof item.quantity === 'number' &&
    typeof item.thumbnail === 'string'
  )
}

function isShippingInfo(value: unknown): value is ShippingInfo {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const shipping = value as Record<string, unknown>

  return (
    typeof shipping.postalCode === 'string' &&
    typeof shipping.address === 'string' &&
    typeof shipping.addressDetail === 'string' &&
    typeof shipping.memo === 'string'
  )
}

export function isValidOrder(value: unknown): value is Order {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const order = value as Record<string, unknown>

  return (
    typeof order.orderNumber === 'string' &&
    typeof order.customerName === 'string' &&
    typeof order.phone === 'string' &&
    typeof order.productTotal === 'number' &&
    typeof order.shippingFee === 'number' &&
    typeof order.totalAmount === 'number' &&
    typeof order.createdAt === 'string' &&
    isShippingInfo(order.shipping) &&
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    order.items.every(isOrderItem)
  )
}

export function saveLatestOrder(order: Order): void {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order))
}

export function loadLatestOrder(): Order | null {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    return isValidOrder(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clearLatestOrder(): void {
  localStorage.removeItem(ORDER_STORAGE_KEY)
}
