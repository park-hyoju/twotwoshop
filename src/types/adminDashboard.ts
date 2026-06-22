import type { DbOrderStatus } from './adminOrder'

export interface AdminDashboardDayActivity {
  dateKey: string
  revenue: number
  orderCount: number
}

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
}

export interface AdminDashboardTaskStats {
  pendingOrderCount: number
  shippingReadyCount: number
  soldOutProductCount: number
  unansweredInquiryCount: number | null
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
  taskStats: AdminDashboardTaskStats
  revenueStats: AdminDashboardRevenueStats
  productStats: AdminDashboardProductStats
  recentOrders: AdminDashboardRecentOrder[]
  dailyActivity: AdminDashboardDayActivity[]
}
