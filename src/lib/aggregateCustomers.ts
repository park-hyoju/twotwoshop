import { calculateCustomerGrade } from './calculateCustomerGrade'
import type { DbOrderStatus } from '../types/adminOrder'
import type {
  AdminCustomerDetail,
  AdminCustomerOrderRow,
  AdminCustomerRow,
  AdminCustomerSearchFilters,
  CustomerMemberType,
  CustomerStatus,
} from '../types/adminCustomer'

export interface CustomerDbRow {
  id: string
  name: string
  phone: string
  email: string | null
  is_member: boolean
  admin_note: string | null
  customer_status: string | null
  zipcode: string | null
  address1: string | null
  address2: string | null
  created_at: string
}

export interface OrderForCustomerAggregation {
  id: string
  order_number: string
  customer_id: string | null
  customer_name: string
  customer_phone: string
  total_amount: number
  status: DbOrderStatus
  created_at: string
  zipcode: string | null
  address1: string | null
  address2: string | null
}

export interface OrderItemForCustomerAggregation {
  order_id: string
  product_name: string
  quantity: number
}

interface CustomerAggregateBucket {
  groupKey: string
  customerIds: Set<string>
  name: string
  phone: string
  email: string | null
  memberType: CustomerMemberType
  status: CustomerStatus
  adminNote: string | null
  shippingAddress: string | null
  orderCount: number
  totalPurchaseAmount: number
  firstOrderAt: string
  lastOrderAt: string
  lastOrderStatus: DbOrderStatus
  orders: AdminCustomerOrderRow[]
}

const STATUS_PRIORITY: Record<CustomerStatus, number> = {
  blocked: 3,
  caution: 2,
  normal: 1,
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function formatShippingAddress(
  zipcode: string | null,
  address1: string | null,
  address2: string | null,
): string | null {
  const parts = [zipcode?.trim(), address1?.trim(), address2?.trim()].filter(Boolean)

  if (parts.length === 0) {
    return null
  }

  return parts.join(' ')
}

/**
 * Order grouping priority:
 * 1) customer_id  2) phone  3) email  4) order id
 *
 * Repeat guest checkouts create a new customer_id each time, so a second pass
 * merges buckets that share the same normalized phone.
 */
export function getCustomerGroupKey(order: OrderForCustomerAggregation, email?: string | null): string {
  if (order.customer_id) {
    return `customer_id:${order.customer_id}`
  }

  const phone = normalizePhone(order.customer_phone)
  if (phone) {
    return `phone:${phone}`
  }

  const normalizedEmail = email?.trim().toLowerCase()
  if (normalizedEmail) {
    return `email:${normalizedEmail}`
  }

  return `order:${order.id}`
}

function parseCustomerStatus(value: string | null | undefined): CustomerStatus {
  if (value === 'caution' || value === 'blocked') {
    return value
  }

  return 'normal'
}

function pickStatus(current: CustomerStatus, next: CustomerStatus): CustomerStatus {
  return STATUS_PRIORITY[next] > STATUS_PRIORITY[current] ? next : current
}

function summarizeOrderItems(
  orderId: string,
  items: OrderItemForCustomerAggregation[],
): string {
  const orderItems = items.filter((item) => item.order_id === orderId)

  if (orderItems.length === 0) {
    return '-'
  }

  if (orderItems.length === 1) {
    return orderItems[0].product_name
  }

  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  return `${orderItems[0].product_name} 외 ${orderItems.length - 1}건 (${totalQuantity}개)`
}

function mergeBuckets(target: CustomerAggregateBucket, source: CustomerAggregateBucket): void {
  source.customerIds.forEach((id) => target.customerIds.add(id))
  target.orderCount += source.orderCount
  target.totalPurchaseAmount += source.totalPurchaseAmount
  target.orders.push(...source.orders)

  if (source.firstOrderAt < target.firstOrderAt) {
    target.firstOrderAt = source.firstOrderAt
    target.shippingAddress = target.shippingAddress ?? source.shippingAddress
  }

  if (source.lastOrderAt > target.lastOrderAt) {
    target.lastOrderAt = source.lastOrderAt
    target.lastOrderStatus = source.lastOrderStatus
    target.name = source.name
    target.shippingAddress = source.shippingAddress ?? target.shippingAddress
  }

  target.status = pickStatus(target.status, source.status)
  target.adminNote = target.adminNote ?? source.adminNote
  target.email = target.email ?? source.email

  if (source.memberType === 'member') {
    target.memberType = 'member'
  }
}

function mergeBucketsByPhone(buckets: Map<string, CustomerAggregateBucket>): Map<string, CustomerAggregateBucket> {
  const phoneToKey = new Map<string, string>()
  const merged = new Map<string, CustomerAggregateBucket>()

  for (const [key, bucket] of buckets) {
    const phone = normalizePhone(bucket.phone)

    if (!phone) {
      merged.set(key, bucket)
      continue
    }

    const existingKey = phoneToKey.get(phone)

    if (!existingKey) {
      phoneToKey.set(phone, key)
      merged.set(key, bucket)
      continue
    }

    const existingBucket = merged.get(existingKey)
    if (existingBucket) {
      mergeBuckets(existingBucket, bucket)
    }
  }

  return merged
}

export function aggregateCustomersFromOrders(
  orders: OrderForCustomerAggregation[],
  customers: CustomerDbRow[],
  orderItems: OrderItemForCustomerAggregation[],
): AdminCustomerDetail[] {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]))
  const buckets = new Map<string, CustomerAggregateBucket>()

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  for (const order of sortedOrders) {
    const linkedCustomer = order.customer_id ? customersById.get(order.customer_id) : undefined
    const groupKey = getCustomerGroupKey(order, linkedCustomer?.email)
    const bucket =
      buckets.get(groupKey) ??
      ({
        groupKey,
        customerIds: new Set<string>(),
        name: order.customer_name,
        phone: order.customer_phone,
        email: linkedCustomer?.email ?? null,
        memberType: linkedCustomer?.is_member ? 'member' : 'guest',
        status: parseCustomerStatus(linkedCustomer?.customer_status),
        adminNote: linkedCustomer?.admin_note ?? null,
        shippingAddress: formatShippingAddress(order.zipcode, order.address1, order.address2),
        orderCount: 0,
        totalPurchaseAmount: 0,
        firstOrderAt: order.created_at,
        lastOrderAt: order.created_at,
        lastOrderStatus: order.status,
        orders: [],
      } satisfies CustomerAggregateBucket)

    if (order.customer_id) {
      bucket.customerIds.add(order.customer_id)

      if (linkedCustomer) {
        bucket.email = linkedCustomer.email ?? bucket.email
        bucket.memberType = linkedCustomer.is_member ? 'member' : 'guest'
        bucket.status = pickStatus(bucket.status, parseCustomerStatus(linkedCustomer.customer_status))
        bucket.adminNote = linkedCustomer.admin_note ?? bucket.adminNote
      }
    }

    bucket.orderCount += 1

    if (order.status !== 'cancelled') {
      bucket.totalPurchaseAmount += order.total_amount
    }

    if (order.created_at < bucket.firstOrderAt) {
      bucket.firstOrderAt = order.created_at
    }

    if (order.created_at >= bucket.lastOrderAt) {
      bucket.lastOrderAt = order.created_at
      bucket.lastOrderStatus = order.status
      bucket.name = order.customer_name
      bucket.shippingAddress =
        formatShippingAddress(order.zipcode, order.address1, order.address2) ?? bucket.shippingAddress
    }

    bucket.orders.push({
      id: order.id,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      productLabel: summarizeOrderItems(order.id, orderItems),
      totalAmount: order.total_amount,
      status: order.status,
    })

    buckets.set(groupKey, bucket)
  }

  const mergedBuckets = mergeBucketsByPhone(buckets)

  return Array.from(mergedBuckets.values()).map((bucket) => ({
    groupKey: bucket.groupKey,
    primaryCustomerId:
      bucket.customerIds.size > 0 ? Array.from(bucket.customerIds).at(-1) ?? null : null,
    linkedCustomerIds: Array.from(bucket.customerIds),
    name: bucket.name,
    phone: bucket.phone,
    email: bucket.email,
    memberType: bucket.memberType,
    grade: calculateCustomerGrade(bucket.totalPurchaseAmount),
    status: bucket.status,
    orderCount: bucket.orderCount,
    totalPurchaseAmount: bucket.totalPurchaseAmount,
    firstOrderAt: bucket.firstOrderAt,
    lastOrderAt: bucket.lastOrderAt,
    lastOrderStatus: bucket.lastOrderStatus,
    shippingAddress: bucket.shippingAddress,
    adminNote: bucket.adminNote,
    orders: [...bucket.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  }))
}

function matchesQuery(customer: AdminCustomerRow, query: string): boolean {
  if (!query) {
    return true
  }

  const normalizedQuery = query.toLowerCase()
  const normalizedPhoneQuery = normalizePhone(query)

  const haystack = [customer.name, customer.phone, customer.email ?? '']
    .join(' ')
    .toLowerCase()

  if (haystack.includes(normalizedQuery)) {
    return true
  }

  if (normalizedPhoneQuery) {
    return normalizePhone(customer.phone).includes(normalizedPhoneQuery)
  }

  return false
}

export function filterAndSortCustomers(
  customers: AdminCustomerRow[],
  filters: AdminCustomerSearchFilters,
): AdminCustomerRow[] {
  const query = filters.query.trim()

  const filtered = customers.filter((customer) => {
    if (!matchesQuery(customer, query)) {
      return false
    }

    if (filters.memberType !== 'all' && customer.memberType !== filters.memberType) {
      return false
    }

    if (filters.grade !== 'all' && customer.grade !== filters.grade) {
      return false
    }

    if (filters.status !== 'all' && customer.status !== filters.status) {
      return false
    }

    return true
  })

  const sorted = [...filtered]

  switch (filters.sort) {
    case 'total_amount':
      sorted.sort((a, b) => b.totalPurchaseAmount - a.totalPurchaseAmount)
      break
    case 'order_count':
      sorted.sort((a, b) => b.orderCount - a.orderCount)
      break
    case 'recent_order':
    default:
      sorted.sort(
        (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
      )
      break
  }

  return sorted
}

export function paginateCustomers<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}
