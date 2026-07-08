import type { PostgrestError } from '@supabase/supabase-js'
import { inferPaymentStatus, normalizeOrderStatus } from '../lib/adminOrderStatus'
import {
  validateMarkDelivered,
  validateMarkShipping,
  validateSaveShipping,
  resolveOrderShipping,
} from '../lib/adminOrderFulfillment'
import { assertAdminRepositoryAccess } from '../lib/adminRepositoryGuard'
import { supabase } from '../lib/supabase'
import type {
  AdminOrderFulfillmentAction,
  AdminOrderItemRow,
  AdminOrderRow,
  AdminOrderShippingUpdate,
  AdminOrderSummaryStats,
  AdminOrdersQueryParams,
  AdminOrdersQueryResult,
} from '../types/adminOrder'
import type { DbOrderStatus } from '../types/adminOrder'

/** Base columns present in schema.sql (always safe). */
const ORDER_LIST_SELECT_BASE = `
  id,
  order_number,
  created_at,
  customer_name,
  customer_phone,
  subtotal,
  shipping_fee,
  total_amount,
  status
`.trim()

/** Optional v2 columns — may 400 if migration not applied. */
const ORDER_LIST_SELECT_V2 = `
  ${ORDER_LIST_SELECT_BASE},
  depositor_name,
  payment_status,
  coupon_discount_amount
`.trim()

const ORDER_DETAIL_SELECT_V2 = `
  id,
  order_number,
  customer_name,
  customer_phone,
  customer_email,
  recipient_name,
  recipient_phone,
  depositor_name,
  zipcode,
  address1,
  address2,
  memo,
  subtotal,
  coupon_discount_amount,
  shipping_fee,
  total_amount,
  status,
  payment_status,
  payment_method,
  created_at
`.trim()

/** Optional fulfillment columns — may 400 if migration not applied. */
const ORDER_LIST_SELECT_FULFILLMENT = `
  ${ORDER_LIST_SELECT_V2},
  courier,
  tracking_number
`.trim()

const ORDER_DETAIL_SELECT_FULFILLMENT = `
  ${ORDER_DETAIL_SELECT_V2},
  courier,
  tracking_number,
  paid_at,
  shipped_at,
  delivered_at
`.trim()

const ORDER_DETAIL_SELECT_BASE = `
  id,
  order_number,
  customer_name,
  customer_phone,
  zipcode,
  address1,
  address2,
  memo,
  subtotal,
  shipping_fee,
  total_amount,
  status,
  created_at
`.trim()

const ORDER_ITEM_SELECT = `
  id,
  order_id,
  product_slug,
  product_name,
  quantity,
  unit_price,
  total_price
`.trim()

interface OrderListRow {
  id: string
  order_number: string
  created_at: string
  customer_name: string
  customer_phone: string
  subtotal: number
  shipping_fee: number
  total_amount: number
  status: AdminOrderRow['status']
  depositor_name?: string | null
  payment_status?: AdminOrderRow['payment_status'] | null
  coupon_discount_amount?: number | null
  courier?: string | null
  tracking_number?: string | null
}

interface OrderDetailRow extends OrderListRow {
  customer_email?: string | null
  recipient_name?: string | null
  recipient_phone?: string | null
  zipcode?: string | null
  address1?: string | null
  address2?: string | null
  memo?: string | null
  payment_method?: string | null
  paid_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
}

interface OrderItemDbRow extends AdminOrderItemRow {
  order_id: string
}

interface AdminOrdersQueryContext {
  select: string
  filters: AdminOrdersQueryParams['filters']
  range: { from: number; to: number }
}

function mapOrderListRow(order: OrderListRow): AdminOrderRow {
  const status = normalizeOrderStatus(order.status) as AdminOrderRow['status']

  return {
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: null,
    recipient_name: null,
    recipient_phone: null,
    depositor_name: order.depositor_name?.trim() || order.customer_name,
    zipcode: null,
    address1: null,
    address2: null,
    memo: null,
    subtotal: order.subtotal,
    coupon_discount_amount: order.coupon_discount_amount ?? 0,
    shipping_fee: order.shipping_fee,
    total_amount: order.total_amount,
    status,
    payment_status: inferPaymentStatus(status, order.payment_status),
    payment_method: 'bank_transfer',
    courier: order.courier ?? null,
    tracking_number: order.tracking_number ?? null,
    paid_at: null,
    shipped_at: null,
    delivered_at: null,
    created_at: order.created_at,
    order_items: [],
  }
}

function mapOrderDetailRow(order: OrderDetailRow, items: AdminOrderItemRow[]): AdminOrderRow {
  return {
    ...mapOrderListRow(order),
    customer_email: order.customer_email ?? null,
    recipient_name: order.recipient_name ?? null,
    recipient_phone: order.recipient_phone ?? null,
    zipcode: order.zipcode ?? null,
    address1: order.address1 ?? null,
    address2: order.address2 ?? null,
    memo: order.memo ?? null,
    payment_method: order.payment_method ?? 'bank_transfer',
    paid_at: order.paid_at ?? null,
    shipped_at: order.shipped_at ?? null,
    delivered_at: order.delivered_at ?? null,
    order_items: items,
  }
}

function getTodayBoundaries() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  return {
    todayStart: todayStart.toISOString(),
    tomorrowStart: tomorrowStart.toISOString(),
  }
}

async function fetchOrderCount(options?: {
  status?: DbOrderStatus
  from?: string
  to?: string
}): Promise<number> {
  let query = supabase!.from('orders').select('*', { count: 'exact', head: true })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.from) {
    query = query.gte('created_at', options.from)
  }

  if (options?.to) {
    query = query.lt('created_at', options.to)
  }

  const { count, error } = await query

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function fetchAdminOrderSummary(): Promise<AdminOrderSummaryStats> {
  await ensureAdminAccess()

  const { todayStart, tomorrowStart } = getTodayBoundaries()

  const [todayOrderCount, pendingOrderCount, shippedOrderCount, completedOrderCount] =
    await Promise.all([
      fetchOrderCount({ from: todayStart, to: tomorrowStart }),
      fetchOrderCount({ status: 'pending_payment' }),
      fetchOrderCount({ status: 'shipping' }),
      fetchOrderCount({ status: 'delivered' }),
    ])

  return {
    todayOrderCount,
    pendingOrderCount,
    shippedOrderCount,
    completedOrderCount,
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

async function ensureAdminAccess(): Promise<void> {
  await assertAdminRepositoryAccess(AdminOrderRepositoryError)
}

function logAdminOrdersDebug(message: string, payload?: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[adminOrderRepository] ${message}`, payload ?? '')
  }
}

function logSupabaseSelectFailure(
  action: string,
  context: AdminOrdersQueryContext,
  error: PostgrestError,
): void {
  console.error(`[adminOrderRepository] ${action}`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    select: context.select,
    filters: context.filters,
    range: context.range,
  })
}

function isMissingColumnError(error: PostgrestError): boolean {
  const message = error.message.toLowerCase()

  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    message.includes('column') ||
    message.includes('does not exist')
  )
}

function applyAdminOrderFilters<T extends {
  ilike: (column: string, pattern: string) => T
  eq: (column: string, value: string) => T
}>(
  query: T,
  filters: AdminOrdersQueryParams['filters'],
): T {
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

  return query
}

async function fetchAdminOrderHeaders(
  params: AdminOrdersQueryParams,
  select: string,
): Promise<{ orders: OrderListRow[]; totalCount: number }> {
  const { page, pageSize, filters } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const context: AdminOrdersQueryContext = { select, filters, range: { from, to } }

  let query = supabase!
    .from('orders')
    .select(select, { count: 'exact' })
    .order('created_at', { ascending: false })

  query = applyAdminOrderFilters(query, filters)

  logAdminOrdersDebug('fetchAdminOrders request', {
    page,
    pageSize,
    select,
    filters,
    range: { from, to },
  })

  const { data, error, count } = await query.range(from, to)

  logAdminOrdersDebug('orders select result', {
    select,
    rowCount: data?.length ?? 0,
    totalCount: count ?? 0,
    error: error?.message ?? null,
  })

  if (error) {
    logSupabaseSelectFailure('orders select failed', context, error)
    throw error
  }

  return {
    orders: (data ?? []) as unknown as OrderListRow[],
    totalCount: count ?? 0,
  }
}

async function fetchOrderItemsByOrderId(orderId: string): Promise<AdminOrderItemRow[]> {
  const { data, error } = await supabase!
    .from('order_items')
    .select(ORDER_ITEM_SELECT)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    logAdminOrdersDebug('order_items select failed', {
      orderId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      select: ORDER_ITEM_SELECT,
    })
    return []
  }

  return ((data ?? []) as unknown as OrderItemDbRow[]).map((item) => ({
    id: item.id,
    product_slug: item.product_slug ?? null,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
  }))
}

export async function fetchAdminOrders(
  params: AdminOrdersQueryParams,
): Promise<AdminOrdersQueryResult> {
  await ensureAdminAccess()

  let result: { orders: OrderListRow[]; totalCount: number }

  try {
    result = await fetchAdminOrderHeaders(params, ORDER_LIST_SELECT_FULFILLMENT)
  } catch (error) {
    if (!isMissingColumnError(error as PostgrestError)) {
      throw new AdminOrderRepositoryError(
        '주문 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
        error,
      )
    }

    logAdminOrdersDebug('retrying orders list with v2 select')
    try {
      result = await fetchAdminOrderHeaders(params, ORDER_LIST_SELECT_V2)
    } catch (v2Error) {
      if (!isMissingColumnError(v2Error as PostgrestError)) {
        throw new AdminOrderRepositoryError(
          '주문 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
          v2Error,
        )
      }

      logAdminOrdersDebug('retrying orders list with base select only')
      try {
        result = await fetchAdminOrderHeaders(params, ORDER_LIST_SELECT_BASE)
      } catch (fallbackError) {
        throw new AdminOrderRepositoryError(
          '주문 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
          fallbackError,
        )
      }
    }
  }

  return {
    orders: result.orders.map(mapOrderListRow),
    totalCount: result.totalCount,
  }
}

export async function fetchAdminOrderById(orderId: string): Promise<AdminOrderRow | null> {
  await ensureAdminAccess()

  async function loadHeader(select: string): Promise<OrderDetailRow | null> {
    const { data, error } = await supabase!
      .from('orders')
      .select(select)
      .eq('id', orderId)
      .maybeSingle()

    if (error) {
      logSupabaseSelectFailure('order detail select failed', {
        select,
        filters: { orderNumber: '', customerName: '', phone: '', status: 'all' },
        range: { from: 0, to: 0 },
      }, error)

      if (isMissingColumnError(error)) {
        return null
      }

      throw new AdminOrderRepositoryError('주문 상세를 불러오지 못했습니다.', error)
    }

    return (data as OrderDetailRow | null) ?? null
  }

  let header = await loadHeader(ORDER_DETAIL_SELECT_FULFILLMENT)

  if (!header) {
    header = await loadHeader(ORDER_DETAIL_SELECT_V2)
  }

  if (!header) {
    header = await loadHeader(ORDER_DETAIL_SELECT_BASE)
  }

  if (!header) {
    return null
  }

  const items = await fetchOrderItemsByOrderId(orderId)
  return mapOrderDetailRow(header, items)
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: AdminOrderRow['status'],
): Promise<void> {
  await ensureAdminAccess()
  await performOrderUpdate(orderId, buildStatusPayload(status), 'updateAdminOrderStatus')
}

const OPTIONAL_ORDER_COLUMNS = [
  'paid_at',
  'shipped_at',
  'delivered_at',
  'courier',
  'tracking_number',
  'payment_status',
] as const

function logSupabaseUpdateFailure(
  action: string,
  orderId: string,
  payload: Record<string, string | null>,
  error: PostgrestError | { message: string; code?: string; details?: string; hint?: string },
): void {
  console.error(`[adminOrderRepository] ${action}`, {
    orderId,
    payload,
    code: 'code' in error ? error.code : undefined,
    message: error.message,
    details: 'details' in error ? error.details : undefined,
    hint: 'hint' in error ? error.hint : undefined,
  })
}

async function performOrderUpdate(
  orderId: string,
  payload: Record<string, string | null>,
  action = 'orders update',
): Promise<void> {
  const originalPayload = { ...payload }
  const current = { ...payload }

  let result = await supabase!
    .from('orders')
    .update(current)
    .eq('id', orderId)
    .select('id')
    .maybeSingle()

  while (result.error && isMissingColumnError(result.error)) {
    const removable = OPTIONAL_ORDER_COLUMNS.find(
      (column) => column in current && result.error!.message.toLowerCase().includes(column),
    )

    if (!removable) {
      break
    }

    if (removable in originalPayload) {
      logSupabaseUpdateFailure(action, orderId, current, result.error)
      throw new AdminOrderRepositoryError(
        `주문 테이블에 ${removable} 컬럼이 없습니다. Supabase SQL Editor에서 supabase/order-fulfillment.sql 을 실행해주세요.`,
        result.error,
      )
    }

    delete current[removable]
    result = await supabase!
      .from('orders')
      .update(current)
      .eq('id', orderId)
      .select('id')
      .maybeSingle()
  }

  if (result.error) {
    logSupabaseUpdateFailure(action, orderId, current, result.error)
    throw new AdminOrderRepositoryError(
      `주문 상태를 변경하지 못했습니다. (${result.error.message})`,
      result.error,
    )
  }

  if (!result.data) {
    const rlsError = {
      message:
        '0 rows updated — RLS UPDATE 정책이 없거나 주문을 찾을 수 없습니다. supabase/fix-admin-orders-update-rls.sql 실행 필요',
      code: 'RLS_BLOCKED',
    }
    logSupabaseUpdateFailure(action, orderId, current, rlsError)
    throw new AdminOrderRepositoryError(rlsError.message)
  }
}

function buildStatusPayload(status: AdminOrderRow['status']): Record<string, string | null> {
  const paymentStatus =
    status === 'payment_confirmed' ||
    status === 'preparing' ||
    status === 'shipping' ||
    status === 'delivered'
      ? 'paid'
      : status === 'cancelled' || status === 'cancel_requested'
        ? 'refunded'
        : 'waiting_deposit'

  const payload: Record<string, string | null> = { status }

  if (paymentStatus !== 'waiting_deposit') {
    payload.payment_status = paymentStatus
  }

  return payload
}

export async function saveAdminOrderShippingInfo(
  order: AdminOrderRow,
  shipping: AdminOrderShippingUpdate,
): Promise<AdminOrderRow> {
  await ensureAdminAccess()

  const validationError = validateSaveShipping(order, {
    courier: shipping.courier,
    trackingNumber: shipping.trackingNumber,
  })
  if (validationError) {
    throw new AdminOrderRepositoryError(validationError)
  }

  const payload: Record<string, string> = {
    courier: shipping.courier.trim(),
    tracking_number: shipping.trackingNumber.trim(),
  }

  await performOrderUpdate(order.id, payload, 'saveAdminOrderShippingInfo')

  if (import.meta.env.DEV) {
    console.log('[adminOrderRepository] saveAdminOrderShippingInfo updated', {
      orderId: order.id,
      courier: payload.courier,
      tracking_number: payload.tracking_number,
    })
  }

  const updated = await fetchAdminOrderById(order.id)
  if (!updated) {
    throw new AdminOrderRepositoryError('송장 저장 후 주문 상세를 불러오지 못했습니다.')
  }

  return updated
}

export async function applyAdminOrderAction(
  order: AdminOrderRow,
  action: AdminOrderFulfillmentAction,
  shipping?: AdminOrderShippingUpdate,
): Promise<AdminOrderRow> {
  await ensureAdminAccess()

  const now = new Date().toISOString()
  let payload: Record<string, string | null> = {}

  switch (action) {
    case 'confirm_payment':
      payload = {
        status: 'payment_confirmed',
        payment_status: 'paid',
        paid_at: now,
      }
      break
    case 'mark_preparing':
      payload = {
        status: 'preparing',
        payment_status: 'paid',
      }
      break
    case 'mark_shipping': {
      const shippingInput = resolveOrderShipping(order, {
        courier: shipping?.courier ?? '',
        trackingNumber: shipping?.trackingNumber ?? '',
      })
      const validationError = validateMarkShipping(order, shippingInput)
      if (validationError) {
        throw new AdminOrderRepositoryError(validationError)
      }
      payload = {
        status: 'shipping',
        payment_status: 'paid',
        courier: shippingInput.courier.trim(),
        tracking_number: shippingInput.trackingNumber.trim(),
        shipped_at: now,
      }
      break
    }
    case 'mark_delivered': {
      const validationError = validateMarkDelivered(order)
      if (validationError) {
        throw new AdminOrderRepositoryError(validationError)
      }
      payload = {
        status: 'delivered',
        payment_status: 'paid',
        delivered_at: now,
      }
      break
    }
    case 'cancel':
      payload = {
        status: 'cancelled',
        payment_status: order.payment_status === 'paid' ? 'refunded' : 'waiting_deposit',
      }
      break
    default:
      throw new AdminOrderRepositoryError('지원하지 않는 주문 처리입니다.')
  }

  await performOrderUpdate(order.id, payload, `applyAdminOrderAction:${action}`)

  const updated = await fetchAdminOrderById(order.id)
  if (!updated) {
    throw new AdminOrderRepositoryError('주문 상태 변경 후 상세를 불러오지 못했습니다.')
  }

  return updated
}

export async function deleteAllAdminOrders(): Promise<number> {
  await ensureAdminAccess()

  const { data: rpcCount, error: rpcError } = await supabase!.rpc('admin_delete_all_orders')

  if (!rpcError && typeof rpcCount === 'number') {
    return rpcCount
  }

  if (rpcError && import.meta.env.DEV) {
    console.warn('[adminOrderRepository] admin_delete_all_orders RPC failed, falling back to delete', rpcError)
  }

  const { count, error } = await supabase!
    .from('orders')
    .delete({ count: 'exact' })
    .gte('created_at', '1970-01-01T00:00:00.000Z')

  if (error) {
    console.error('[adminOrderRepository] deleteAllAdminOrders failed', error)
    throw new AdminOrderRepositoryError(
      '주문 데이터를 삭제하지 못했습니다. 관리자 권한과 RLS 정책(admin-orders-security-rls.sql)을 확인해주세요.',
      error,
    )
  }

  return count ?? 0
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
