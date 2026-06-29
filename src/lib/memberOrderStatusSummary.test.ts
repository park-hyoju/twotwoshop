import { describe, expect, it } from 'vitest'
import { summarizeMemberOrderStatuses } from './memberOrderStatusSummary'
import type { MemberOrderSummary } from '../types/mypage'

function createOrder(status: MemberOrderSummary['status']): MemberOrderSummary {
  return {
    id: `order-${status}`,
    orderNumber: 'TT-001',
    status,
    paymentStatus: 'waiting_deposit',
    subtotal: 24000,
    couponDiscountAmount: 0,
    shippingFee: 4000,
    totalAmount: 28000,
    customerName: '홍길동',
    depositorName: '홍길동',
    createdAt: '2026-06-01T00:00:00.000Z',
    itemCount: 1,
    firstProductName: '상품',
  }
}

describe('summarizeMemberOrderStatuses', () => {
  it('groups member orders into mypage status buckets', () => {
    const summary = summarizeMemberOrderStatuses([
      createOrder('pending_payment'),
      createOrder('pending_payment'),
      createOrder('payment_confirmed'),
      createOrder('preparing'),
      createOrder('shipping'),
      createOrder('delivered'),
      createOrder('cancelled'),
    ])

    expect(summary).toEqual({
      waitingPayment: 2,
      preparing: 2,
      shipping: 1,
      completed: 1,
    })
  })
})
