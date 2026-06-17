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

async function saveOrderToSupabase(order: Order): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert(mapOrderToCustomerInsert(order))
    .select('id')
    .single()

  if (customerError || !customer) {
    throw customerError ?? new Error('Failed to insert customer')
  }

  const { data: savedOrder, error: orderError } = await supabase
    .from('orders')
    .insert(mapOrderToOrderInsert(order, customer.id))
    .select('id')
    .single()

  if (orderError || !savedOrder) {
    throw orderError ?? new Error('Failed to insert order')
  }

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(mapOrderItemsToInsert(order, savedOrder.id))

  if (itemsError) {
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
