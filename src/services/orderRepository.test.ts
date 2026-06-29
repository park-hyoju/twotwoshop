import { describe, expect, it, vi, beforeEach } from 'vitest'
import { OrderSaveError, orderRepository } from './orderRepository'

const rpcMock = vi.fn()
const fromMock = vi.fn()

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}))

vi.mock('./productRepository', () => ({
  productRepository: {
    findProductBySlug: vi.fn().mockResolvedValue({ stock: 99 }),
  },
}))

vi.mock('../lib/orderStorage', () => ({
  saveLatestOrder: vi.fn(),
  loadLatestOrder: vi.fn(),
  clearLatestOrder: vi.fn(),
}))

const baseOrder = {
  id: '',
  orderNumber: 'TT-TEST-001',
  customerName: '홍길동',
  customerPhone: '01012345678',
  customerEmail: 'test@example.com',
  recipientName: '홍길동',
  recipientPhone: '01012345678',
  depositorName: '홍길동',
  shipping: {
    postalCode: '12345',
    address: '서울',
    addressDetail: '',
    memo: '',
  },
  productTotal: 1000,
  couponDiscount: 0,
  shippingFee: 4000,
  totalAmount: 5000,
  paymentMethod: 'bank_transfer',
  paymentStatus: 'waiting_deposit',
  memberCouponId: null,
  isMember: false,
  createdAt: new Date().toISOString(),
} as const

describe('orderRepository.saveOrder', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    fromMock.mockReset()
  })

  it('throws OrderSaveError when product id is not a UUID', async () => {
    const order = {
      ...baseOrder,
      items: [
        {
          productId: 'not-a-uuid',
          slug: 'test-product',
          name: '테스트',
          price: 1000,
          quantity: 1,
          thumbnail: '/images/placeholder.png',
        },
      ],
    } as never

    await expect(orderRepository.saveOrder(order)).rejects.toBeInstanceOf(OrderSaveError)
    expect(rpcMock).not.toHaveBeenCalled()
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('uses create_shop_order_with_stock RPC when product ids are UUIDs', async () => {
    rpcMock.mockResolvedValue({ error: null })

    const order = {
      ...baseOrder,
      items: [
        {
          productId: '11111111-1111-4111-8111-111111111111',
          slug: 'test-product',
          name: '테스트',
          price: 1000,
          quantity: 1,
          thumbnail: '/images/placeholder.png',
        },
      ],
    } as never

    await orderRepository.saveOrder(order)

    expect(rpcMock).toHaveBeenCalledWith(
      'create_shop_order_with_stock',
      expect.objectContaining({
        p_items: [
          expect.objectContaining({
            product_id: '11111111-1111-4111-8111-111111111111',
          }),
        ],
      }),
    )
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('throws OrderSaveError when RPC fails', async () => {
    rpcMock.mockResolvedValue({ error: { message: 'DB failure' } })

    const order = {
      ...baseOrder,
      items: [
        {
          productId: '11111111-1111-4111-8111-111111111111',
          slug: 'test-product',
          name: '테스트',
          price: 1000,
          quantity: 1,
          thumbnail: '/images/placeholder.png',
        },
      ],
    } as never

    await expect(orderRepository.saveOrder(order)).rejects.toBeInstanceOf(OrderSaveError)
  })
})
