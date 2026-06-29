import { describe, expect, it } from 'vitest'
import { mapOrderToOrderInsert } from './orderMapper'
import type { Order } from '../types/order'

const sampleOrder: Order = {
  orderNumber: 'TT-20260617-123456',
  customerName: '홍길동',
  customerPhone: '01012345678',
  customerEmail: 'test@example.com',
  recipientName: '홍길동',
  recipientPhone: '01012345678',
  depositorName: '홍길동',
  shipping: {
    postalCode: '12345',
    address: '서울시 강남구',
    addressDetail: '101호',
    memo: '',
  },
  items: [],
  productTotal: 24000,
  couponDiscount: 3000,
  shippingFee: 4000,
  totalAmount: 25000,
  paymentMethod: 'bank_transfer',
  paymentStatus: 'waiting_deposit',
  memberCouponId: null,
  isMember: true,
  createdAt: '2026-06-17T00:00:00.000Z',
}

describe('mapOrderToOrderInsert', () => {
  it('includes user_id when a logged-in member places an order', () => {
    const payload = mapOrderToOrderInsert(sampleOrder, 'customer-1', 'user-1')

    expect(payload.user_id).toBe('user-1')
    expect(payload.shipping_fee).toBe(4000)
    expect(payload.coupon_discount_amount).toBe(3000)
    expect(payload.status).toBe('pending_payment')
  })

  it('stores null user_id for guest checkout', () => {
    const payload = mapOrderToOrderInsert(sampleOrder, 'customer-1', null)

    expect(payload.user_id).toBeNull()
  })
})
