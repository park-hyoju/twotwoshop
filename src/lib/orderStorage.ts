import type { Order, OrderItem, PaymentMethod, ShippingInfo } from '../types/order'
import { normalizePaymentStatus } from './adminOrderStatus'

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

function normalizeLegacyOrder(order: Record<string, unknown>): Order | null {
  if (
    typeof order.orderNumber !== 'string' ||
    typeof order.productTotal !== 'number' ||
    typeof order.shippingFee !== 'number' ||
    typeof order.totalAmount !== 'number' ||
    typeof order.createdAt !== 'string' ||
    !isShippingInfo(order.shipping) ||
    !Array.isArray(order.items) ||
    order.items.length === 0 ||
    !order.items.every(isOrderItem)
  ) {
    return null
  }

  const customerName =
    typeof order.customerName === 'string'
      ? order.customerName
      : typeof order.customer_name === 'string'
        ? order.customer_name
        : ''

  const customerPhone =
    typeof order.customerPhone === 'string'
      ? order.customerPhone
      : typeof order.phone === 'string'
        ? order.phone
        : ''

  return {
    id: typeof order.id === 'string' ? order.id : undefined,
    orderNumber: order.orderNumber,
    customerName,
    customerPhone,
    customerEmail: typeof order.customerEmail === 'string' ? order.customerEmail : '',
    recipientName:
      typeof order.recipientName === 'string' ? order.recipientName : customerName,
    recipientPhone:
      typeof order.recipientPhone === 'string' ? order.recipientPhone : customerPhone,
    depositorName:
      typeof order.depositorName === 'string' ? order.depositorName : customerName,
    shipping: order.shipping,
    items: order.items,
    productTotal: order.productTotal,
    couponDiscount:
      typeof order.couponDiscount === 'number' ? order.couponDiscount : 0,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    paymentMethod: (order.paymentMethod as PaymentMethod) ?? 'bank_transfer',
    paymentStatus: normalizePaymentStatus(
      typeof order.paymentStatus === 'string' ? order.paymentStatus : 'waiting_deposit',
    ),
    memberCouponId:
      typeof order.memberCouponId === 'string' ? order.memberCouponId : null,
    isMember: order.isMember === true,
    createdAt: order.createdAt,
  }
}

export function isValidOrder(value: unknown): value is Order {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return normalizeLegacyOrder(value as Record<string, unknown>) !== null
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
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    return normalizeLegacyOrder(parsed as Record<string, unknown>)
  } catch {
    return null
  }
}

export function clearLatestOrder(): void {
  localStorage.removeItem(ORDER_STORAGE_KEY)
}
