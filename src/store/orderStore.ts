import { SHIPPING_FEE, calculateOrderTotal } from '../lib/orderConstants'
import { resolveDepositorName, resolveRecipientFields } from '../lib/checkoutAddress'
import {
  hasCheckoutFormErrors,
  sanitizeCheckoutForm,
  validateCheckoutForm,
} from '../utils/validators'
import type { CartItem } from '../types/cart'
import type { CheckoutFormData, Order, OrderItem } from '../types/order'
import type { MemberCoupon } from '../types/coupon'

export { hasCheckoutFormErrors, validateCheckoutForm }

function createOrderItem(item: CartItem): OrderItem {
  return {
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    thumbnail: item.thumbnail,
  }
}

export function generateOrderNumber(): string {
  const now = new Date()
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const timePart = String(now.getTime()).slice(-6)

  return `TT-${datePart}-${timePart}`
}

export function createOrder(
  items: CartItem[],
  form: CheckoutFormData,
  options?: {
    selectedCoupon?: MemberCoupon | null
    isMember?: boolean
  },
): Order {
  const sanitizedForm = sanitizeCheckoutForm(form)
  const recipient = resolveRecipientFields(sanitizedForm)
  const depositorName = resolveDepositorName(sanitizedForm)
  const orderItems = items.map(createOrderItem)
  const productTotal = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )
  const couponDiscount = options?.selectedCoupon?.discountAmount ?? 0

  return {
    orderNumber: generateOrderNumber(),
    customerName: sanitizedForm.customerName,
    customerPhone: sanitizedForm.customerPhone,
    customerEmail: sanitizedForm.customerEmail,
    recipientName: recipient.recipientName,
    recipientPhone: recipient.recipientPhone,
    depositorName,
    shipping: {
      postalCode: sanitizedForm.postalCode,
      address: sanitizedForm.address,
      addressDetail: sanitizedForm.addressDetail,
      memo: sanitizedForm.memo,
    },
    items: orderItems,
    productTotal,
    couponDiscount,
    shippingFee: SHIPPING_FEE,
    totalAmount: calculateOrderTotal(productTotal, couponDiscount),
    paymentMethod: 'bank_transfer',
    paymentStatus: 'waiting_deposit',
    memberCouponId: sanitizedForm.selectedCouponId,
    isMember: options?.isMember ?? false,
    createdAt: new Date().toISOString(),
  }
}

export function canSubmitOrder(items: CartItem[], hasSoldOut: boolean): boolean {
  return items.length > 0 && !hasSoldOut
}
