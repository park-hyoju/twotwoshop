import { describe, expect, it } from 'vitest'
import {
  COUPON_MIN_ORDER_AMOUNT,
  SHIPPING_FEE,
  WELCOME_COUPON_DISCOUNT,
  WELCOME_COUPON_TITLE,
  calculateOrderTotal,
  calculateShippingFee,
} from '../lib/orderConstants'
import { createOrder } from './orderStore'
import { INITIAL_CHECKOUT_FORM } from '../types/order'
import type { CartItem } from '../types/cart'
import type { MemberCoupon } from '../types/coupon'

const sampleItem: CartItem = {
  cartLineId: 'product-1',
  productId: 'product-1',
  slug: 'sample-product',
  name: '샘플 상품',
  price: 24000,
  quantity: 1,
  thumbnail: '/sample.jpg',
  stock: 10,
}

const welcomeCoupon: MemberCoupon = {
  id: 'mc-1',
  couponId: 'c-1',
  code: 'WELCOME5000',
  title: WELCOME_COUPON_TITLE,
  discountAmount: WELCOME_COUPON_DISCOUNT,
  minOrderAmount: COUPON_MIN_ORDER_AMOUNT,
  expiresAt: null,
}

const checkoutForm = {
  ...INITIAL_CHECKOUT_FORM,
  customerName: '홍길동',
  customerPhone: '01012345678',
  postalCode: '12345',
  address: '서울시 강남구',
  addressDetail: '101호',
  sameAsOrdererForDepositor: true,
  sameAsOrdererForRecipient: true,
  agreedOrder: true,
  agreedPrivacy: true,
}

describe('orderStore', () => {
  it('charges shipping fee when subtotal is below free-shipping threshold', () => {
    const order = createOrder([sampleItem], checkoutForm)

    expect(order.productTotal).toBe(24000)
    expect(order.shippingFee).toBe(SHIPPING_FEE)
    expect(order.totalAmount).toBe(28000)
    expect(order.depositorName).toBe('홍길동')
  })

  it('applies free shipping at 70000 subtotal', () => {
    const highValueItem: CartItem = { ...sampleItem, price: 70000 }
    const order = createOrder([highValueItem], checkoutForm)

    expect(order.shippingFee).toBe(0)
    expect(calculateOrderTotal(70000)).toBe(70000)
    expect(order.totalAmount).toBe(70000)
  })

  it('applies welcome coupon discount with free shipping at 70000', () => {
    const highValueItem: CartItem = { ...sampleItem, price: 70000 }
    const order = createOrder([highValueItem], {
      ...checkoutForm,
      selectedCouponId: welcomeCoupon.id,
    }, {
      selectedCoupon: welcomeCoupon,
      isMember: true,
    })

    expect(order.couponDiscount).toBe(WELCOME_COUPON_DISCOUNT)
    expect(order.shippingFee).toBe(0)
    expect(order.totalAmount).toBe(65000)
    expect(order.memberCouponId).toBe(welcomeCoupon.id)
  })

  it('calculates shipping from subtotal before coupon discount', () => {
    expect(calculateShippingFee(70000)).toBe(0)
    expect(calculateOrderTotal(70000, WELCOME_COUPON_DISCOUNT)).toBe(65000)
  })
})
