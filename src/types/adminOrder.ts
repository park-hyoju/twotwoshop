export type DbOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export interface AdminOrderItemRow {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface AdminOrderRow {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  total_amount: number
  status: DbOrderStatus
  created_at: string
  order_items: AdminOrderItemRow[]
}

export interface AdminOrderSearchFilters {
  orderNumber: string
  customerName: string
  phone: string
}

export interface AdminOrdersQueryParams {
  page: number
  pageSize: number
  filters: AdminOrderSearchFilters
}

export interface AdminOrdersQueryResult {
  orders: AdminOrderRow[]
  totalCount: number
}
