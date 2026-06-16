import { SHIPPING_FEE } from '../lib/orderConstants'
import type { CartItem } from '../types/cart'
import type { CheckoutFormData, CheckoutFormErrors, Order, OrderItem } from '../types/order'

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
): Order {
  const orderItems = items.map(createOrderItem)
  const productTotal = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  return {
    orderNumber: generateOrderNumber(),
    customerName: form.customerName.trim(),
    phone: form.phone.trim(),
    shipping: {
      postalCode: form.postalCode.trim(),
      address: form.address.trim(),
      addressDetail: form.addressDetail.trim(),
      memo: form.memo.trim(),
    },
    items: orderItems,
    productTotal,
    shippingFee: SHIPPING_FEE,
    totalAmount: productTotal + SHIPPING_FEE,
    createdAt: new Date().toISOString(),
  }
}

export function validateCheckoutForm(form: CheckoutFormData): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {}
  const name = form.customerName.trim()
  const phone = form.phone.trim()
  const postalCode = form.postalCode.trim()
  const address = form.address.trim()
  const addressDetail = form.addressDetail.trim()
  const memo = form.memo.trim()

  if (!name) {
    errors.customerName = '주문자 이름을 입력해주세요.'
  } else if (!/^[가-힣a-zA-Z]{2,10}$/.test(name)) {
    errors.customerName = '이름은 한글 또는 영문 2~10자로 입력해주세요.'
  }

  if (!phone) {
    errors.phone = '연락처를 입력해주세요.'
  } else if (!/^\d+$/.test(phone)) {
    errors.phone = '연락처는 숫자만 입력해주세요.'
  } else if (phone.length < 10 || phone.length > 11) {
    errors.phone = '연락처는 10~11자리로 입력해주세요.'
  }

  if (!postalCode) {
    errors.postalCode = '우편번호를 입력해주세요.'
  } else if (!/^\d{5}$/.test(postalCode)) {
    errors.postalCode = '우편번호는 숫자 5자리로 입력해주세요.'
  }

  if (!address) {
    errors.address = '주소를 입력해주세요.'
  } else if (address.length < 5) {
    errors.address = '주소를 입력해주세요.'
  }

  if (!addressDetail) {
    errors.addressDetail = '상세주소를 입력해주세요.'
  } else if (addressDetail.length < 2) {
    errors.addressDetail = '상세주소를 입력해주세요.'
  }

  if (memo.length > 100) {
    errors.memo = '배송메모는 100자 이내로 입력해주세요.'
  }

  return errors
}

export function hasCheckoutFormErrors(errors: CheckoutFormErrors): boolean {
  return Object.keys(errors).length > 0
}

export function canSubmitOrder(items: CartItem[], hasSoldOut: boolean): boolean {
  return items.length > 0 && !hasSoldOut
}
