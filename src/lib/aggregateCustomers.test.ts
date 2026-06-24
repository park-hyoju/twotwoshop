import { describe, expect, it } from 'vitest'
import {
  aggregateCustomersFromOrders,
  filterAndSortCustomers,
  getCustomerGroupKey,
  normalizePhone,
  type CustomerDbRow,
  type OrderForCustomerAggregation,
} from './aggregateCustomers'
import { EMPTY_ADMIN_CUSTOMER_FILTERS } from './adminCustomerFilters'

const baseCustomer: CustomerDbRow = {
  id: 'cust-1',
  name: '홍길동',
  phone: '010-1234-5678',
  email: 'hong@example.com',
  is_member: false,
  admin_note: null,
  customer_status: 'normal',
  zipcode: '12345',
  address1: '서울시',
  address2: '101호',
  created_at: '2026-06-01T00:00:00.000Z',
}

function makeOrder(
  overrides: Partial<OrderForCustomerAggregation> & Pick<OrderForCustomerAggregation, 'id'>,
): OrderForCustomerAggregation {
  return {
    order_number: `TT-${overrides.id}`,
    customer_id: 'cust-1',
    customer_name: '홍길동',
    customer_phone: '010-1234-5678',
    total_amount: 100_000,
    status: 'completed',
    created_at: '2026-06-10T00:00:00.000Z',
    zipcode: '12345',
    address1: '서울시',
    address2: '101호',
    ...overrides,
  }
}

describe('aggregateCustomersFromOrders', () => {
  it('groups by customer_id first', () => {
    const customers = [baseCustomer]
    const orders = [makeOrder({ id: 'order-1' }), makeOrder({ id: 'order-2' })]

    const result = aggregateCustomersFromOrders(orders, customers, [])

    expect(result).toHaveLength(1)
    expect(result[0].orderCount).toBe(2)
    expect(result[0].groupKey).toBe('customer_id:cust-1')
  })

  it('merges repeat guest orders by phone when customer_id differs', () => {
    const customers: CustomerDbRow[] = [
      { ...baseCustomer, id: 'cust-a' },
      { ...baseCustomer, id: 'cust-b' },
    ]
    const orders = [
      makeOrder({ id: 'order-1', customer_id: 'cust-a' }),
      makeOrder({ id: 'order-2', customer_id: 'cust-b', created_at: '2026-06-11T00:00:00.000Z' }),
    ]

    const result = aggregateCustomersFromOrders(orders, customers, [])

    expect(result).toHaveLength(1)
    expect(result[0].orderCount).toBe(2)
    expect(result[0].linkedCustomerIds).toEqual(expect.arrayContaining(['cust-a', 'cust-b']))
  })

  it('excludes cancelled orders from total purchase amount', () => {
    const customers = [baseCustomer]
    const orders = [
      makeOrder({ id: 'order-1', total_amount: 200_000, status: 'completed' }),
      makeOrder({ id: 'order-2', total_amount: 150_000, status: 'cancelled' }),
    ]

    const result = aggregateCustomersFromOrders(orders, customers, [])

    expect(result[0].totalPurchaseAmount).toBe(200_000)
    expect(result[0].orderCount).toBe(2)
  })

  it('uses order id as fallback group key without phone', () => {
    const order = makeOrder({
      id: 'order-only',
      customer_id: null,
      customer_phone: '',
    })

    expect(getCustomerGroupKey(order)).toBe('order:order-only')
  })
})

describe('filterAndSortCustomers', () => {
  const customers = aggregateCustomersFromOrders(
    [
      makeOrder({ id: 'a', total_amount: 600_000, created_at: '2026-06-01T00:00:00.000Z' }),
      makeOrder({
        id: 'b',
        customer_id: 'cust-2',
        customer_name: '김철수',
        customer_phone: '010-9999-8888',
        total_amount: 50_000,
        created_at: '2026-06-20T00:00:00.000Z',
      }),
    ],
    [
      baseCustomer,
      { ...baseCustomer, id: 'cust-2', name: '김철수', phone: '010-9999-8888', email: null },
    ],
    [],
  )

  it('filters by query across name and phone', () => {
    const filtered = filterAndSortCustomers(customers, {
      ...EMPTY_ADMIN_CUSTOMER_FILTERS,
      query: normalizePhone('010-9999-8888'),
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('김철수')
  })

  it('sorts by total purchase amount', () => {
    const filtered = filterAndSortCustomers(customers, {
      ...EMPTY_ADMIN_CUSTOMER_FILTERS,
      sort: 'total_amount',
    })

    expect(filtered[0].totalPurchaseAmount).toBeGreaterThanOrEqual(filtered[1].totalPurchaseAmount)
  })
})
