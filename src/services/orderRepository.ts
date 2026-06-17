import {
  clearLatestOrder as clearStoredLatestOrder,
  loadLatestOrder,
  saveLatestOrder,
} from '../lib/orderStorage'
import type { Order } from '../types/order'

export interface OrderRepository {
  saveOrder(order: Order): void
  getLatestOrder(): Order | null
  clearLatestOrder(): void
}

const localStorageOrderRepository: OrderRepository = {
  saveOrder: (order) => saveLatestOrder(order),

  getLatestOrder: () => loadLatestOrder(),

  clearLatestOrder: () => clearStoredLatestOrder(),
}

export const orderRepository: OrderRepository = localStorageOrderRepository
