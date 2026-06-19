import {
  clearLatestOrder as clearStoredLatestOrder,
  loadLatestOrder,
  saveLatestOrder,
} from '../lib/orderStorage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Order } from '../types/order'
import {
  mapOrderItemsToInsert,
  mapOrderToCustomerInsert,
  mapOrderToOrderInsert,
} from './orderMapper'

export interface OrderRepository {
  saveOrder(order: Order): Promise<void>
  getLatestOrder(): Order | null
  clearLatestOrder(): void
}

function logSupabaseError(step: string, error: unknown): void {
  if (error && typeof error === 'object' && 'message' in error) {
    console.warn(`[orderRepository] ${step} failed:`, error)
    return
  }

  console.warn(`[orderRepository] ${step} failed:`, error)
}

async function saveOrderToSupabase(order: Order): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  // Client-generated UUIDs avoid INSERT...RETURNING, which would require
  // SELECT RLS policies on customers/orders (not granted to anon by design).
  const customerId = crypto.randomUUID()
  const orderId = crypto.randomUUID()

  const { error: customerError } = await supabase.from('customers').insert({
    id: customerId,
    ...mapOrderToCustomerInsert(order),
  })

  if (customerError) {
    logSupabaseError('customers insert', customerError)
    throw customerError
  }

  const { error: orderError } = await supabase.from('orders').insert({
    id: orderId,
    ...mapOrderToOrderInsert(order, customerId),
  })

  if (orderError) {
    logSupabaseError('orders insert', orderError)
    throw orderError
  }

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(mapOrderItemsToInsert(order, orderId))

  if (itemsError) {
    logSupabaseError('order_items insert', itemsError)
    throw itemsError
  }
}

/**
 * Guest order persistence.
 *
 * - Supabase configured: customers → orders → order_items insert (best effort)
 * - Always saves latest order to localStorage for Order Complete screen
 * - Supabase failure does not block checkout (localStorage fallback)
 */
export const orderRepository: OrderRepository = {
  saveOrder: async (order) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await saveOrderToSupabase(order)
      } catch (error) {
        console.warn(
          '[orderRepository] Supabase save failed, using localStorage only:',
          error,
        )
      }
    }

    saveLatestOrder(order)
  },

  getLatestOrder: () => loadLatestOrder(),

  clearLatestOrder: () => clearStoredLatestOrder(),
}
