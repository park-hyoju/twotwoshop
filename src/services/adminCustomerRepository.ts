import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  aggregateCustomersFromOrders,
  filterAndSortCustomers,
  normalizePhone,
  paginateCustomers,
  type CustomerDbRow,
  type OrderForCustomerAggregation,
  type OrderItemForCustomerAggregation,
} from '../lib/aggregateCustomers'
import type {
  AdminCustomerDetail,
  AdminCustomersQueryParams,
  AdminCustomersQueryResult,
  AdminCustomerUpdateInput,
} from '../types/adminCustomer'

const CUSTOMER_SELECT = `
  id,
  name,
  phone,
  email,
  is_member,
  admin_note,
  customer_status,
  zipcode,
  address1,
  address2,
  created_at
`

const ORDER_SELECT = `
  id,
  order_number,
  customer_id,
  customer_name,
  customer_phone,
  total_amount,
  status,
  created_at,
  zipcode,
  address1,
  address2
`

const ORDER_ITEM_SELECT = `
  order_id,
  product_name,
  quantity
`

export class AdminCustomerRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminCustomerRepositoryError'
    this.cause = cause
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminCustomerRepositoryError(
      '고객 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    )
  }
}

async function fetchAllOrders(): Promise<OrderForCustomerAggregation[]> {
  const { data, error } = await supabase!
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    throw new AdminCustomerRepositoryError('주문 데이터를 불러오지 못했습니다.', error)
  }

  return (data ?? []) as OrderForCustomerAggregation[]
}

async function fetchAllCustomers(): Promise<CustomerDbRow[]> {
  const { data, error } = await supabase!.from('customers').select(CUSTOMER_SELECT)

  if (error) {
    throw new AdminCustomerRepositoryError('고객 데이터를 불러오지 못했습니다.', error)
  }

  return (data ?? []) as CustomerDbRow[]
}

async function fetchAllOrderItems(): Promise<OrderItemForCustomerAggregation[]> {
  const { data, error } = await supabase!.from('order_items').select(ORDER_ITEM_SELECT)

  if (error) {
    return []
  }

  return (data ?? []) as OrderItemForCustomerAggregation[]
}

let cachedCustomers: AdminCustomerDetail[] | null = null
let cachedOrders: OrderForCustomerAggregation[] | null = null
let cachedOrderItems: OrderItemForCustomerAggregation[] | null = null
let cachedCustomerRecords: CustomerDbRow[] | null = null

function invalidateCustomerCache(): void {
  cachedCustomers = null
  cachedOrders = null
  cachedOrderItems = null
  cachedCustomerRecords = null
}

async function loadAggregatedCustomers(): Promise<AdminCustomerDetail[]> {
  if (cachedCustomers) {
    return cachedCustomers
  }

  const [orders, customers, orderItems] = await Promise.all([
    cachedOrders ? Promise.resolve(cachedOrders) : fetchAllOrders(),
    cachedCustomerRecords ? Promise.resolve(cachedCustomerRecords) : fetchAllCustomers(),
    cachedOrderItems ? Promise.resolve(cachedOrderItems) : fetchAllOrderItems(),
  ])

  cachedOrders = orders
  cachedCustomerRecords = customers
  cachedOrderItems = orderItems
  cachedCustomers = aggregateCustomersFromOrders(orders, customers, orderItems)

  return cachedCustomers
}

export async function fetchAdminCustomers(
  params: AdminCustomersQueryParams,
): Promise<AdminCustomersQueryResult> {
  assertSupabaseReady()

  const allCustomers = await loadAggregatedCustomers()
  const filtered = filterAndSortCustomers(allCustomers, params.filters)

  return {
    customers: paginateCustomers(filtered, params.page, params.pageSize),
    totalCount: filtered.length,
  }
}

export async function fetchAdminCustomerDetail(groupKey: string): Promise<AdminCustomerDetail | null> {
  assertSupabaseReady()

  const allCustomers = await loadAggregatedCustomers()
  return allCustomers.find((row) => row.groupKey === groupKey) ?? null
}

export async function updateAdminCustomer(input: AdminCustomerUpdateInput): Promise<void> {
  assertSupabaseReady()

  const ids = new Set(input.linkedCustomerIds)
  const normalizedPhone = normalizePhone(input.phone)

  if (normalizedPhone) {
    for (const customer of cachedCustomerRecords ?? []) {
      if (normalizePhone(customer.phone) === normalizedPhone) {
        ids.add(customer.id)
      }
    }
  }

  if (ids.size === 0) {
    throw new AdminCustomerRepositoryError('저장할 고객 정보를 찾지 못했습니다.')
  }

  const updates = Array.from(ids).map((id) =>
    supabase!
      .from('customers')
      .update({
        admin_note: input.adminNote.trim() || null,
        customer_status: input.customerStatus,
      })
      .eq('id', id),
  )

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)

  if (failed?.error) {
    throw new AdminCustomerRepositoryError('고객 정보를 저장하지 못했습니다.', failed.error)
  }

  invalidateCustomerCache()
}

export function clearAdminCustomerCache(): void {
  invalidateCustomerCache()
}
