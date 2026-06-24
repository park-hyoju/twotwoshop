import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { buildDailyActivityList } from '../lib/adminDashboardCalendar'
import type { DbOrderStatus } from '../types/adminOrder'
import type {
  AdminDashboardData,
  AdminDashboardRecentOrder,
  AdminDashboardRevenueStats,
} from '../types/adminDashboard'
import { isDbOrderStatus } from '../lib/adminOrderStatus'
import { fetchUnansweredInquiryCount } from './adminInquiryRepository'

const RECENT_ORDER_SELECT = `
  id,
  order_number,
  customer_name,
  total_amount,
  status,
  created_at
`

interface OrderAmountRow {
  total_amount: number
  created_at: string
  status: string
}

interface ProductStatusRow {
  status: string
}

export class AdminDashboardRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminDashboardRepositoryError'
    this.cause = cause
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminDashboardRepositoryError(
      '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    )
  }
}

function getDateBoundaries() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    todayStart: todayStart.toISOString(),
    tomorrowStart: tomorrowStart.toISOString(),
    monthStart: monthStart.toISOString(),
  }
}

function isCountableRevenue(status: string): boolean {
  return status !== 'cancelled'
}

function sumRevenue(
  rows: OrderAmountRow[],
  options: { from?: string; to?: string } = {},
): number {
  return rows.reduce((sum, row) => {
    if (!isCountableRevenue(row.status)) {
      return sum
    }

    const createdAt = new Date(row.created_at).getTime()

    if (options.from && createdAt < new Date(options.from).getTime()) {
      return sum
    }

    if (options.to && createdAt >= new Date(options.to).getTime()) {
      return sum
    }

    return sum + row.total_amount
  }, 0)
}

function buildRevenueStats(rows: OrderAmountRow[]): AdminDashboardRevenueStats {
  const { todayStart, tomorrowStart, monthStart } = getDateBoundaries()

  return {
    todayRevenue: sumRevenue(rows, { from: todayStart, to: tomorrowStart }),
    monthRevenue: sumRevenue(rows, { from: monthStart }),
    totalRevenue: sumRevenue(rows),
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

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  assertSupabaseReady()

  const { todayStart, tomorrowStart } = getDateBoundaries()

  try {
    const [
      todayOrderCount,
      totalOrderCount,
      pendingOrderCount,
      shippingReadyCount,
      orderAmountResult,
      productStatusResult,
      recentOrdersResult,
      unansweredInquiryCount,
    ] = await Promise.all([
      fetchOrderCount({ from: todayStart, to: tomorrowStart }),
      fetchOrderCount(),
      fetchOrderCount({ status: 'pending' }),
      fetchOrderCount({ status: 'confirmed' }),
      supabase!.from('orders').select('total_amount, created_at, status'),
      supabase!.from('products').select('status'),
      supabase!
        .from('orders')
        .select(RECENT_ORDER_SELECT)
        .order('created_at', { ascending: false })
        .limit(5),
      fetchUnansweredInquiryCount(),
    ])

    if (orderAmountResult.error) {
      throw orderAmountResult.error
    }

    if (productStatusResult.error) {
      throw productStatusResult.error
    }

    if (recentOrdersResult.error) {
      throw recentOrdersResult.error
    }

    const orderAmountRows = (orderAmountResult.data ?? []) as OrderAmountRow[]
    const productStatusRows = (productStatusResult.data ?? []) as ProductStatusRow[]

    const productStats = {
      totalCount: productStatusRows.length,
      activeCount: productStatusRows.filter((row) => row.status === 'active').length,
      soldOutCount: productStatusRows.filter((row) => row.status === 'soldout').length,
      hiddenCount: productStatusRows.filter((row) => row.status === 'hidden').length,
    }

    const recentOrders: AdminDashboardRecentOrder[] = (recentOrdersResult.data ?? [])
      .map((row) => {
        if (
          typeof row.id !== 'string' ||
          typeof row.order_number !== 'string' ||
          typeof row.customer_name !== 'string' ||
          typeof row.created_at !== 'string' ||
          typeof row.total_amount !== 'number' ||
          !isDbOrderStatus(row.status)
        ) {
          return null
        }

        return {
          id: row.id,
          order_number: row.order_number,
          customer_name: row.customer_name,
          total_amount: row.total_amount,
          status: row.status,
          created_at: row.created_at,
        }
      })
      .filter((row): row is AdminDashboardRecentOrder => row !== null)

    return {
      orderStats: {
        todayOrderCount,
        totalOrderCount,
      },
      taskStats: {
        pendingOrderCount,
        shippingReadyCount,
        soldOutProductCount: productStats.soldOutCount,
        unansweredInquiryCount,
      },
      revenueStats: buildRevenueStats(orderAmountRows),
      productStats,
      recentOrders,
      dailyActivity: buildDailyActivityList(orderAmountRows),
    }
  } catch (error) {
    console.warn('[adminDashboardRepository] fetch failed:', error)
    throw new AdminDashboardRepositoryError(
      '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      error,
    )
  }
}
