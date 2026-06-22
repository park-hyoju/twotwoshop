import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type {
  AdminOrderItemRow,
  AdminOrderRow,
  AdminOrdersQueryParams,
  AdminOrdersQueryResult,
} from '../types/adminOrder'

const ORDER_HEADER_SELECT = `
  id,
  order_number,
  customer_name,
  customer_phone,
  total_amount,
  status,
  created_at
`

const ORDER_ITEM_SELECT = `
  id,
  order_id,
  product_name,
  quantity,
  unit_price,
  total_price
`

interface OrderHeaderRow {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  total_amount: number
  status: AdminOrderRow['status']
  created_at: string
}

interface OrderItemDbRow extends AdminOrderItemRow {
  order_id: string
}

export class AdminOrderRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminOrderRepositoryError'
    this.cause = cause
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminOrderRepositoryError(
      '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  }
}

function logAdminOrdersDebug(message: string, payload?: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[adminOrderRepository] ${message}`, payload ?? '')
  }
}

function groupOrderItemsByOrderId(items: OrderItemDbRow[]): Map<string, AdminOrderItemRow[]> {
  const map = new Map<string, AdminOrderItemRow[]>()

  for (const item of items) {
    const current = map.get(item.order_id) ?? []
    current.push({
      id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    })
    map.set(item.order_id, current)
  }

  return map
}

async function fetchOrderItemsByOrderIds(orderIds: string[]): Promise<Map<string, AdminOrderItemRow[]>> {
  if (orderIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase!
    .from('order_items')
    .select(ORDER_ITEM_SELECT)
    .in('order_id', orderIds)

  if (error) {
    logAdminOrdersDebug('order_items select failed (orders will still be shown)', error)
    return new Map()
  }

  return groupOrderItemsByOrderId((data ?? []) as OrderItemDbRow[])
}

export async function fetchAdminOrders(
  params: AdminOrdersQueryParams,
): Promise<AdminOrdersQueryResult> {
  assertSupabaseReady()

  const { page, pageSize, filters } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase!
    .from('orders')
    .select(ORDER_HEADER_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  const orderNumber = filters.orderNumber.trim()
  const customerName = filters.customerName.trim()
  const phone = filters.phone.trim()

  if (orderNumber) {
    query = query.ilike('order_number', `%${orderNumber}%`)
  }

  if (customerName) {
    query = query.ilike('customer_name', `%${customerName}%`)
  }

  if (phone) {
    query = query.ilike('customer_phone', `%${phone}%`)
  }

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  logAdminOrdersDebug('fetchAdminOrders request', {
    page,
    pageSize,
    filters,
    range: { from, to },
  })

  const { data, error, count } = await query.range(from, to)

  logAdminOrdersDebug('orders select result', {
    rowCount: data?.length ?? 0,
    totalCount: count ?? 0,
    error: error?.message ?? null,
  })

  if (error) {
    console.warn('[adminOrderRepository] orders select failed:', error)
    throw new AdminOrderRepositoryError(
      '주문 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      error,
    )
  }

  const orderHeaders = (data ?? []) as OrderHeaderRow[]
  const itemsByOrderId = await fetchOrderItemsByOrderIds(orderHeaders.map((order) => order.id))

  const orders: AdminOrderRow[] = orderHeaders.map((order) => ({
    ...order,
    order_items: itemsByOrderId.get(order.id) ?? [],
  }))

  return {
    orders,
    totalCount: count ?? 0,
  }
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: AdminOrderRow['status'],
): Promise<void> {
  assertSupabaseReady()

  const { error } = await supabase!
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    throw new AdminOrderRepositoryError('주문 상태를 변경하지 못했습니다.', error)
  }
}

export function summarizeOrderItems(
  items: AdminOrderRow['order_items'],
): { productLabel: string; quantityLabel: string } {
  if (items.length === 0) {
    return { productLabel: '-', quantityLabel: '-' }
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  if (items.length === 1) {
    return {
      productLabel: items[0].product_name,
      quantityLabel: String(items[0].quantity),
    }
  }

  return {
    productLabel: `${items[0].product_name} 외 ${items.length - 1}건`,
    quantityLabel: String(totalQuantity),
  }
}
