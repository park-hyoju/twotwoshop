import type { Order, OrderItem } from '../types/order'
import { calculateShippingFee } from '../lib/orderConstants'

export interface CustomerInsert {
  name: string
  phone: string
  zipcode: string | null
  address1: string | null
  address2: string | null
}

export interface OrderInsert {
  order_number: string
  customer_id: string
  user_id?: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  recipient_name: string
  recipient_phone: string
  zipcode: string | null
  address1: string | null
  address2: string | null
  memo: string | null
  depositor_name: string
  payment_method: string
  subtotal: number
  coupon_discount_amount: number
  shipping_fee: number
  total_amount: number
  payment_status: 'waiting_deposit'
  status: 'pending_payment'
  member_coupon_id?: string | null
}

export interface OrderItemInsert {
  order_id: string
  product_id: string | null
  product_slug: string | null
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function mapOrderToCustomerInsert(order: Order): CustomerInsert {
  return {
    name: order.customerName,
    phone: order.customerPhone,
    zipcode: emptyToNull(order.shipping.postalCode),
    address1: emptyToNull(order.shipping.address),
    address2: emptyToNull(order.shipping.addressDetail),
  }
}

export function mapOrderToOrderInsert(
  order: Order,
  customerId: string,
  userId?: string | null,
): OrderInsert {
  return {
    order_number: order.orderNumber,
    customer_id: customerId,
    user_id: userId ?? null,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: emptyToNull(order.customerEmail),
    recipient_name: order.recipientName,
    recipient_phone: order.recipientPhone,
    zipcode: emptyToNull(order.shipping.postalCode),
    address1: emptyToNull(order.shipping.address),
    address2: emptyToNull(order.shipping.addressDetail),
    memo: emptyToNull(order.shipping.memo),
    depositor_name: order.depositorName,
    payment_method: order.paymentMethod,
    subtotal: order.productTotal,
    coupon_discount_amount: order.couponDiscount,
    shipping_fee: calculateShippingFee(order.productTotal),
    total_amount: order.totalAmount,
    payment_status: 'waiting_deposit',
    status: 'pending_payment',
    member_coupon_id: order.memberCouponId,
  }
}

export function mapOrderItemToInsert(
  item: OrderItem,
  orderId: string,
): OrderItemInsert {
  return {
    order_id: orderId,
    product_id: item.productId,
    product_slug: item.slug,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity,
  }
}

export function mapOrderItemsToInsert(
  order: Order,
  orderId: string,
): OrderItemInsert[] {
  return order.items.map((item) => mapOrderItemToInsert(item, orderId))
}

export function mapOrderToRpcPayload(order: Order) {
  return {
    order_number: order.orderNumber,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail,
    recipient_name: order.recipientName,
    recipient_phone: order.recipientPhone,
    zipcode: order.shipping.postalCode,
    address1: order.shipping.address,
    address2: order.shipping.addressDetail,
    memo: order.shipping.memo,
    depositor_name: order.depositorName,
    payment_method: order.paymentMethod,
    subtotal: order.productTotal,
    shipping_fee: calculateShippingFee(order.productTotal),
  }
}
