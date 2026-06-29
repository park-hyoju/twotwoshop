import type { PostgrestError } from '@supabase/supabase-js'
import { isDbOrderStatus, inferPaymentStatus, normalizeOrderStatus } from '../lib/adminOrderStatus'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { MemberOrderDetail, MemberOrderItem, MemberOrderSummary } from '../types/mypage'

export class CustomerOrderRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'CustomerOrderRepositoryError'
    this.cause = cause
  }
}

const MEMBER_ORDER_LIST_SELECT =
  'id, order_number, status, payment_status, subtotal, coupon_discount_amount, shipping_fee, total_amount, customer_name, depositor_name, created_at, order_items(product_name, created_at)'

const MEMBER_ORDER_DETAIL_SELECT =
  'id, order_number, status, payment_status, subtotal, coupon_discount_amount, shipping_fee, total_amount, customer_name, customer_phone, customer_email, recipient_name, recipient_phone, depositor_name, courier, tracking_number, paid_at, shipped_at, delivered_at, zipcode, address1, address2, memo, created_at, order_items(id, product_id, product_slug, product_name, quantity, unit_price, total_price, created_at)'

interface MemberOrderItemRow {
  product_name?: string | null
  created_at?: string | null
}

interface MemberOrderListRow {
  id: string
  order_number: string
  status: string
  payment_status?: string | null
  subtotal: number | string | null
  coupon_discount_amount?: number | string | null
  shipping_fee: number | string | null
  total_amount: number | string | null
  customer_name: string
  depositor_name?: string | null
  created_at: string
  order_items?: MemberOrderItemRow[] | null
}

interface MemberOrderDetailRow extends MemberOrderListRow {
  customer_phone: string
  customer_email?: string | null
  recipient_name?: string | null
  recipient_phone?: string | null
  courier?: string | null
  tracking_number?: string | null
  paid_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  zipcode: string | null
  address1: string | null
  address2: string | null
  memo: string | null
  order_items?: Array<{
    id: string
    product_id: string | null
    product_slug: string | null
    product_name: string
    quantity: number | string
    unit_price: number | string
    total_price: number | string
    created_at: string
  }> | null
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new CustomerOrderRepositoryError('주문 내역을 불러올 수 없습니다.')
  }
}

function logSupabaseError(action: string, error: PostgrestError): void {
  console.error(`[customerOrderRepository] ${action}`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  })
}

function isMissingRpcFunction(error: PostgrestError): boolean {
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    error.message.includes('get_member_orders') ||
    error.message.includes('Could not find the function')
  )
}

function isMissingUserIdColumn(error: PostgrestError): boolean {
  return (
    (error.code === '42703' || error.message.toLowerCase().includes('column')) &&
    error.message.includes('user_id')
  )
}

function mapSupabaseError(action: string, error: PostgrestError): CustomerOrderRepositoryError {
  logSupabaseError(action, error)

  if (isMissingRpcFunction(error) || isMissingUserIdColumn(error)) {
    return new CustomerOrderRepositoryError(
      '주문 조회 기능이 준비되지 않았습니다. Supabase SQL Editor에서 supabase/member-orders-fix.sql을 실행해주세요.',
      error,
    )
  }

  if (error.code === '42501' || error.message.toLowerCase().includes('row-level security')) {
    return new CustomerOrderRepositoryError(
      '주문 내역 조회 권한이 없습니다. 로그인 상태를 확인해주세요.',
      error,
    )
  }

  const messages: Record<string, string> = {
    fetch: '주문 내역을 불러오지 못했습니다.',
    detail: '주문 상세를 불러오지 못했습니다.',
  }

  return new CustomerOrderRepositoryError(messages[action] ?? '주문 처리에 실패했습니다.', error)
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function resolveOrderItems(items: MemberOrderItemRow[] | null | undefined): MemberOrderItemRow[] {
  if (!Array.isArray(items)) {
    return []
  }

  return [...items].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0
    return leftTime - rightTime
  })
}

export function parseMemberOrderRow(item: unknown): MemberOrderSummary | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const row = item as Record<string, unknown>
  const totalAmount = toNumber(row.total_amount, Number.NaN)

  if (
    typeof row.id !== 'string' ||
    typeof row.order_number !== 'string' ||
    typeof row.customer_name !== 'string' ||
    typeof row.created_at !== 'string' ||
    !isDbOrderStatus(String(row.status)) ||
    Number.isNaN(totalAmount)
  ) {
    return null
  }

  const subtotal = toNumber(row.subtotal, totalAmount)
  const shippingFee = toNumber(row.shipping_fee, 0)
  const rawItems = row.items ?? row.order_items
  const itemCount =
    typeof row.item_count === 'number'
      ? row.item_count
      : Array.isArray(rawItems)
        ? rawItems.length
        : 0

  return {
    id: row.id,
    orderNumber: row.order_number,
    status: normalizeOrderStatus(String(row.status)) as MemberOrderSummary['status'],
    paymentStatus: inferPaymentStatus(String(row.status), String(row.payment_status ?? '')),
    subtotal,
    couponDiscountAmount: toNumber(row.coupon_discount_amount, 0),
    shippingFee,
    totalAmount,
    customerName: row.customer_name,
    depositorName:
      typeof row.depositor_name === 'string' && row.depositor_name.trim() !== ''
        ? row.depositor_name
        : row.customer_name,
    createdAt: row.created_at,
    itemCount,
    firstProductName:
      typeof row.first_product_name === 'string'
        ? row.first_product_name
        : Array.isArray(rawItems) &&
            rawItems[0] &&
            typeof rawItems[0] === 'object' &&
            'product_name' in rawItems[0] &&
            typeof rawItems[0].product_name === 'string'
          ? rawItems[0].product_name
          : null,
  }
}

function mapMemberOrderListRow(row: MemberOrderListRow): MemberOrderSummary | null {
  const items = resolveOrderItems(row.order_items)

  return parseMemberOrderRow({
    id: row.id,
    order_number: row.order_number,
    status: row.status,
    payment_status: row.payment_status,
    subtotal: row.subtotal,
    coupon_discount_amount: row.coupon_discount_amount,
    shipping_fee: row.shipping_fee,
    total_amount: row.total_amount,
    customer_name: row.customer_name,
    depositor_name: row.depositor_name,
    created_at: row.created_at,
    item_count: items.length,
    first_product_name: items[0]?.product_name ?? null,
  })
}

function mapMemberOrderItemRow(
  row: NonNullable<MemberOrderDetailRow['order_items']>[number],
): MemberOrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    quantity: toNumber(row.quantity, 0),
    unitPrice: toNumber(row.unit_price, 0),
    totalPrice: toNumber(row.total_price, 0),
  }
}

function mapMemberOrderDetailRow(row: MemberOrderDetailRow): MemberOrderDetail | null {
  const summary = mapMemberOrderListRow(row)

  if (!summary) {
    return null
  }

  const items = Array.isArray(row.order_items)
    ? row.order_items.map(mapMemberOrderItemRow)
    : []

  return {
    ...summary,
    itemCount: items.length,
    firstProductName: items[0]?.productName ?? null,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email ?? null,
    recipientName: row.recipient_name ?? null,
    recipientPhone: row.recipient_phone ?? null,
    zipcode: row.zipcode,
    address1: row.address1,
    address2: row.address2,
    memo: row.memo,
    courier: row.courier ?? null,
    trackingNumber: row.tracking_number ?? null,
    paidAt: row.paid_at ?? null,
    shippedAt: row.shipped_at ?? null,
    deliveredAt: row.delivered_at ?? null,
    items,
  }
}

function isMissingOrderDetailRpc(error: PostgrestError): boolean {
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    error.message.includes('get_member_order_by_id') ||
    error.message.includes('Could not find the function')
  )
}

function parseMemberOrderDetailFromRpc(data: unknown): MemberOrderDetail | null {
  let row: unknown = data

  if (typeof data === 'string') {
    try {
      row = JSON.parse(data) as unknown
    } catch {
      return null
    }
  }

  if (!row || typeof row !== 'object') {
    return null
  }

  const record = row as Record<string, unknown>
  const summary = parseMemberOrderRow(record)

  if (!summary) {
    return null
  }

  const rawItems = record.items ?? record.order_items
  const items = Array.isArray(rawItems)
    ? rawItems
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null
          }

          const orderItem = item as Record<string, unknown>

          if (
            typeof orderItem.id !== 'string' ||
            typeof orderItem.product_name !== 'string'
          ) {
            return null
          }

          return {
            id: orderItem.id,
            productId: typeof orderItem.product_id === 'string' ? orderItem.product_id : null,
            productSlug:
              typeof orderItem.product_slug === 'string' ? orderItem.product_slug : null,
            productName: orderItem.product_name,
            quantity: toNumber(orderItem.quantity, 0),
            unitPrice: toNumber(orderItem.unit_price, 0),
            totalPrice: toNumber(orderItem.total_price, 0),
          } satisfies MemberOrderItem
        })
        .filter((item): item is MemberOrderItem => item !== null)
    : []

  return {
    ...summary,
    itemCount: items.length,
    firstProductName: items[0]?.productName ?? null,
    customerPhone: typeof record.customer_phone === 'string' ? record.customer_phone : '',
    customerEmail: typeof record.customer_email === 'string' ? record.customer_email : null,
    recipientName: typeof record.recipient_name === 'string' ? record.recipient_name : null,
    recipientPhone: typeof record.recipient_phone === 'string' ? record.recipient_phone : null,
    zipcode: typeof record.zipcode === 'string' ? record.zipcode : null,
    address1: typeof record.address1 === 'string' ? record.address1 : null,
    address2: typeof record.address2 === 'string' ? record.address2 : null,
    memo: typeof record.memo === 'string' ? record.memo : null,
    courier: typeof record.courier === 'string' ? record.courier : null,
    trackingNumber: typeof record.tracking_number === 'string' ? record.tracking_number : null,
    paidAt: typeof record.paid_at === 'string' ? record.paid_at : null,
    shippedAt: typeof record.shipped_at === 'string' ? record.shipped_at : null,
    deliveredAt: typeof record.delivered_at === 'string' ? record.delivered_at : null,
    items,
  }
}

function parseMemberOrdersFromRpc(data: unknown): MemberOrderSummary[] {
  let rows: unknown = data

  if (typeof data === 'string') {
    try {
      rows = JSON.parse(data) as unknown
    } catch {
      return []
    }
  }

  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map(parseMemberOrderRow)
    .filter((item): item is MemberOrderSummary => item !== null)
}

async function fetchMemberOrdersViaTable(): Promise<MemberOrderSummary[]> {
  const { data, error } = await supabase!
    .from('orders')
    .select(MEMBER_ORDER_LIST_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    throw mapSupabaseError('fetch', error)
  }

  return (data as MemberOrderListRow[] | null ?? [])
    .map(mapMemberOrderListRow)
    .filter((item): item is MemberOrderSummary => item !== null)
}

export async function fetchMemberOrders(): Promise<MemberOrderSummary[]> {
  assertSupabaseReady()

  const { data, error } = await supabase!.rpc('get_member_orders')

  if (!error) {
    return parseMemberOrdersFromRpc(data)
  }

  logSupabaseError('get_member_orders RPC', error)

  if (isMissingRpcFunction(error) || isMissingUserIdColumn(error)) {
    return fetchMemberOrdersViaTable()
  }

  throw mapSupabaseError('fetch', error)
}

export async function fetchMemberOrderById(orderId: string): Promise<MemberOrderDetail | null> {
  assertSupabaseReady()

  const { data: rpcData, error: rpcError } = await supabase!.rpc('get_member_order_by_id', {
    p_order_id: orderId,
  })

  if (!rpcError) {
    return parseMemberOrderDetailFromRpc(rpcData)
  }

  logSupabaseError('get_member_order_by_id RPC', rpcError)

  if (!isMissingOrderDetailRpc(rpcError)) {
    throw mapSupabaseError('detail', rpcError)
  }

  const { data, error } = await supabase!
    .from('orders')
    .select(MEMBER_ORDER_DETAIL_SELECT)
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    throw mapSupabaseError('detail', error)
  }

  if (!data) {
    return null
  }

  return mapMemberOrderDetailRow(data as MemberOrderDetailRow)
}
