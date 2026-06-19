import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type {
  AdminOrderRow,
  AdminOrdersQueryParams,
  AdminOrdersQueryResult,
  DbOrderStatus,
} from '../types/adminOrder'

const ORDER_SELECT = `
  id,
  order_number,
  customer_name,
  customer_phone,
  total_amount,
  status,
  created_at,
  order_items (
    id,
    product_name,
    quantity,
    unit_price,
    total_price
  )
`

function normalizeOrderRow(row: AdminOrderRow): AdminOrderRow {
  return {
    ...row,
    order_items: Array.isArray(row.order_items) ? row.order_items : [],
  }
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
      'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.',
    )
  }
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
    .select(ORDER_SELECT, { count: 'exact' })
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

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new AdminOrderRepositoryError(
      '주문 목록을 불러오지 못했습니다. Supabase RLS 정책(admin-orders-rls.sql) 적용 여부를 확인해주세요.',
      error,
    )
  }

  return {
    orders: (data ?? []).map((row) => normalizeOrderRow(row as AdminOrderRow)),
    totalCount: count ?? 0,
  }
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: DbOrderStatus,
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
