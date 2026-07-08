import {
  clearLatestOrder as clearStoredLatestOrder,
  loadLatestOrder,
  saveLatestOrder,
} from '../lib/orderStorage'
import { INSUFFICIENT_STOCK_ORDER_MESSAGE } from '../lib/productStock'
import {
  findProductVariant,
  getProductOptionStock,
  hasProductOptions,
} from '../lib/productVariants'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { logSupabaseError } from '../utils/errorLog'
import type { Order } from '../types/order'
import { mapOrderToCustomerInsert, mapOrderToRpcPayload } from './orderMapper'
import { productRepository } from './productRepository'

export class OrderStockError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderStockError'
  }
}

export class OrderCouponError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderCouponError'
  }
}

export class OrderSaveError extends Error {
  cause?: unknown

  constructor(
    message = '주문 접수에 실패했습니다. 다시 시도해주세요.',
    cause?: unknown,
  ) {
    super(message)
    this.name = 'OrderSaveError'
    this.cause = cause
  }
}

export interface OrderRepository {
  saveOrder(order: Order): Promise<void>
  getLatestOrder(): Order | null
  clearLatestOrder(): void
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function isInsufficientStockError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const message =
    'message' in error && typeof error.message === 'string' ? error.message : ''

  return message.includes('INSUFFICIENT_STOCK')
}

function isCouponError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const message =
    'message' in error && typeof error.message === 'string' ? error.message : ''

  return (
    message.includes('INVALID_COUPON') ||
    message.includes('COUPON_MIN_ORDER_NOT_MET') ||
    message.includes('COUPON_REQUIRES_LOGIN')
  )
}

async function validateOrderStockFromRepository(order: Order): Promise<void> {
  for (const item of order.items) {
    const product = await productRepository.findProductBySlug(item.slug)

    if (!product) {
      throw new OrderStockError(INSUFFICIENT_STOCK_ORDER_MESSAGE)
    }

    const availableStock =
      hasProductOptions(product) && (item.selectedColor || item.selectedSize)
        ? getProductOptionStock(product, item.selectedColor ?? '', item.selectedSize ?? '')
        : product.stock

    if (availableStock < item.quantity) {
      throw new OrderStockError(INSUFFICIENT_STOCK_ORDER_MESSAGE)
    }

    if (
      hasProductOptions(product) &&
      item.selectedColor &&
      item.selectedSize &&
      !findProductVariant(product.variants, item.selectedColor, item.selectedSize)
    ) {
      throw new OrderStockError(INSUFFICIENT_STOCK_ORDER_MESSAGE)
    }
  }
}

async function saveOrderWithStockRpc(order: Order): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const customerId = crypto.randomUUID()
  const orderId = crypto.randomUUID()
  const customer = mapOrderToCustomerInsert(order)

  const itemsPayload = order.items.map((item) => ({
    product_id: item.productId,
    product_slug: item.slug,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity,
    selected_color: item.selectedColor ?? null,
    selected_size: item.selectedSize ?? null,
    option_id: item.optionId ?? null,
  }))

  const { error } = await supabase.rpc('create_shop_order_with_stock', {
    p_customer_id: customerId,
    p_customer: {
      name: customer.name,
      phone: customer.phone,
      zipcode: customer.zipcode,
      address1: customer.address1,
      address2: customer.address2,
    },
    p_order_id: orderId,
    p_order: mapOrderToRpcPayload(order),
    p_items: itemsPayload,
    p_member_coupon_id: order.memberCouponId,
  })

  if (error) {
    logSupabaseError('orderRepository.create_shop_order_with_stock', error)

    if (isInsufficientStockError(error)) {
      throw new OrderStockError(INSUFFICIENT_STOCK_ORDER_MESSAGE)
    }

    if (isCouponError(error)) {
      throw new OrderCouponError('선택한 쿠폰을 사용할 수 없습니다. 쿠폰을 다시 선택해주세요.')
    }

    throw error
  }

  order.id = orderId
}

async function saveOrderToSupabase(order: Order): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  if (!order.items.every((item) => isUuid(item.productId))) {
    throw new OrderSaveError(
      '상품 정보가 올바르지 않습니다. 장바구니를 비운 뒤 다시 담아주세요.',
    )
  }

  await saveOrderWithStockRpc(order)
}

export const orderRepository: OrderRepository = {
  saveOrder: async (order) => {
    await validateOrderStockFromRepository(order)

    if (!isSupabaseConfigured || !supabase) {
      throw new OrderSaveError()
    }

    try {
      await saveOrderToSupabase(order)
    } catch (error) {
      if (error instanceof OrderStockError || error instanceof OrderCouponError) {
        throw error
      }

      throw new OrderSaveError('주문 접수에 실패했습니다. 다시 시도해주세요.', error)
    }

    saveLatestOrder(order)
  },

  getLatestOrder: () => loadLatestOrder(),

  clearLatestOrder: () => clearStoredLatestOrder(),
}
