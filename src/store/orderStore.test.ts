import { describe, expect, it } from 'vitest'
import { SHIPPING_FEE, calculateOrderTotal } from '../lib/orderConstants'
import { createOrder } from './orderStore'
import { INITIAL_CHECKOUT_FORM } from '../types/order'
import type { CartItem } from '../types/cart'

const sampleItem: CartItem = {
  productId: 'product-1',
  slug: 'sample-product',
  name: '샘플 상품',
  price: 24000,
  quantity: 1,
  thumbnail: '/sample.jpg',
  stock: 10,
}

describe('orderStore', () => {
  it('uses flat shipping fee of 4000', () => {
    expect(SHIPPING_FEE).toBe(4000)
    expect(calculateOrderTotal(24000)).toBe(28000)
  })

  it('creates order with product total + shipping fee', () => {
    const order = createOrder([sampleItem], {
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
    })

    expect(order.productTotal).toBe(24000)
    expect(order.shippingFee).toBe(4000)
    expect(order.totalAmount).toBe(28000)
    expect(order.depositorName).toBe('홍길동')
  })
})
