export type RestockNotificationStatus = 'created' | 'already_subscribed'

export interface RestockSubscribeResult {
  status: RestockNotificationStatus
}

export interface GuestRestockSubscribeInput {
  productId: string
  customerName: string
  phone: string
  email?: string
}

export interface AdminRestockNotificationRow {
  id: string
  product_id: string
  product_name: string
  product_slug: string
  user_id: string | null
  customer_name: string | null
  phone: string | null
  email: string | null
  is_notified: boolean
  created_at: string
  notified_at: string | null
}

export const RESTOCK_SUBSCRIBE_MESSAGES: Record<RestockNotificationStatus, string> = {
  created: '재입고 알림 신청이 완료되었어요.',
  already_subscribed: '이미 재입고 알림을 신청하셨어요.',
}
