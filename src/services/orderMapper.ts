import type { Order, OrderItem } from '../types/order'

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
  customer_name: string
  customer_phone: string
  zipcode: string | null
  address1: string | null
  address2: string | null
  memo: string | null
  subtotal: number
  shipping_fee: number
  total_amount: number
  status: 'pending'
}

export interface OrderItemInsert {
  order_id: string
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
    phone: order.phone,
    zipcode: emptyToNull(order.shipping.postalCode),
    address1: emptyToNull(order.shipping.address),
    address2: emptyToNull(order.shipping.addressDetail),
  }
}

export function mapOrderToOrderInsert(
  order: Order,
  customerId: string,
): OrderInsert {
  return {
    order_number: order.orderNumber,
    customer_id: customerId,
    customer_name: order.customerName,
    customer_phone: order.phone,
    zipcode: emptyToNull(order.shipping.postalCode),
    address1: emptyToNull(order.shipping.address),
    address2: emptyToNull(order.shipping.addressDetail),
    memo: emptyToNull(order.shipping.memo),
    subtotal: order.productTotal,
    shipping_fee: order.shippingFee,
    total_amount: order.totalAmount,
    status: 'pending',
  }
}

export function mapOrderItemToInsert(
  item: OrderItem,
  orderId: string,
): OrderItemInsert {
  return {
    order_id: orderId,
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
