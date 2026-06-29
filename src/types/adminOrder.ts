export type DbOrderStatus =
  | 'pending_payment'
  | 'payment_confirmed'
  | 'preparing'
  | 'shipping'
  | 'delivered'
  | 'cancel_requested'
  | 'cancelled'
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'shipped'
  | 'completed'
  | 'deposit_confirmed'

export type DbPaymentStatus = 'waiting_deposit' | 'paid' | 'refunded'

export interface AdminOrderItemRow {
  id: string
  product_slug: string | null
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
  customer_email: string | null
  recipient_name: string | null
  recipient_phone: string | null
  depositor_name: string | null
  zipcode: string | null
  address1: string | null
  address2: string | null
  memo: string | null
  subtotal: number
  coupon_discount_amount: number
  shipping_fee: number
  total_amount: number
  status: DbOrderStatus
  payment_status: DbPaymentStatus
  payment_method: string
  courier: string | null
  tracking_number: string | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
  order_items: AdminOrderItemRow[]
}

export type AdminOrderFulfillmentAction =
  | 'confirm_payment'
  | 'mark_preparing'
  | 'mark_shipping'
  | 'mark_delivered'
  | 'cancel'

export interface AdminOrderShippingUpdate {
  courier: string
  trackingNumber: string
}

export interface AdminOrderSearchFilters {
  orderNumber: string
  customerName: string
  phone: string
  status: AdminOrderStatusFilter
}

export type AdminOrderStatusFilter = 'all' | DbOrderStatus

export interface AdminOrdersQueryParams {
  page: number
  pageSize: number
  filters: AdminOrderSearchFilters
}

export interface AdminOrdersQueryResult {
  orders: AdminOrderRow[]
  totalCount: number
}

export interface AdminOrderSummaryStats {
  todayOrderCount: number
  pendingOrderCount: number
  shippedOrderCount: number
  completedOrderCount: number
}
