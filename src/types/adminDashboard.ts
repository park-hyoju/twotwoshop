import type { DbOrderStatus } from './adminOrder'

export interface AdminDashboardRecentOrder {
  id: string
  order_number: string
  customer_name: string
  total_amount: number
  status: DbOrderStatus
  created_at: string
}

export interface AdminDashboardOrderStats {
  todayOrderCount: number
  totalOrderCount: number
  pendingOrderCount: number
}

export interface AdminDashboardRevenueStats {
  todayRevenue: number
  monthRevenue: number
  totalRevenue: number
}

export interface AdminDashboardProductStats {
  totalCount: number
  activeCount: number
  soldOutCount: number
  hiddenCount: number
}

export interface AdminDashboardData {
  orderStats: AdminDashboardOrderStats
  revenueStats: AdminDashboardRevenueStats
  productStats: AdminDashboardProductStats
  recentOrders: AdminDashboardRecentOrder[]
}
