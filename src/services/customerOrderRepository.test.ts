import { describe, expect, it } from 'vitest'
import { parseMemberOrderRow } from './customerOrderRepository'

describe('parseMemberOrderRow', () => {
  it('parses RPC rows with numeric strings', () => {
    const parsed = parseMemberOrderRow({
      id: 'order-1',
      order_number: 'TT-20260617-123456',
      status: 'pending_payment',
      subtotal: '24000',
      shipping_fee: '4000',
      total_amount: '28000',
      customer_name: '홍길동',
      created_at: '2026-06-17T00:00:00.000Z',
      item_count: 2,
      first_product_name: '테스트 상품',
    })

    expect(parsed).toEqual({
      id: 'order-1',
      orderNumber: 'TT-20260617-123456',
      status: 'pending_payment',
      paymentStatus: 'waiting_deposit',
      subtotal: 24000,
      couponDiscountAmount: 0,
      shippingFee: 4000,
      totalAmount: 28000,
      customerName: '홍길동',
      depositorName: '홍길동',
      createdAt: '2026-06-17T00:00:00.000Z',
      itemCount: 2,
      firstProductName: '테스트 상품',
    })
  })

  it('returns null for invalid rows instead of throwing', () => {
    expect(parseMemberOrderRow(null)).toBeNull()
    expect(parseMemberOrderRow({ id: 'only-id' })).toBeNull()
  })

  it('parses RPC detail rows using items key', () => {
    const parsed = parseMemberOrderRow({
      id: 'order-2',
      order_number: 'TT-20260617-654321',
      status: 'pending_payment',
      subtotal: 12000,
      shipping_fee: 4000,
      total_amount: 16000,
      customer_name: '김철수',
      created_at: '2026-06-17T01:00:00.000Z',
      items: [{ product_name: 'RPC 상품 A' }, { product_name: 'RPC 상품 B' }],
    })

    expect(parsed?.itemCount).toBe(2)
    expect(parsed?.firstProductName).toBe('RPC 상품 A')
  })
})
