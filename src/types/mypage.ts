import type { DbInquiryStatus, DbInquiryType } from './adminInquiry'
import type { DbOrderStatus, DbPaymentStatus } from './adminOrder'

export interface MemberOrderSummary {
  id: string
  orderNumber: string
  status: DbOrderStatus
  paymentStatus: DbPaymentStatus
  subtotal: number
  couponDiscountAmount: number
  shippingFee: number
  totalAmount: number
  customerName: string
  depositorName: string
  createdAt: string
  itemCount: number
  firstProductName: string | null
  courier?: string | null
  trackingNumber?: string | null
}

export interface CustomerAddress {
  id: string
  userId: string
  label: string
  recipientName: string
  phone: string
  zipcode: string
  address1: string
  address2: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerAddressInput {
  label: string
  recipientName: string
  phone: string
  zipcode: string
  address1: string
  address2?: string
  isDefault?: boolean
}

export interface MemberInquirySummary {
  id: string
  inquiryCode: string | null
  type: DbInquiryType
  status: DbInquiryStatus
  message: string
  adminReply: string | null
  createdAt: string
  updatedAt: string
  customerReadAt: string | null
  hasUnreadReply: boolean
}

export interface MemberRestockNotification {
  id: string
  productId: string
  productName: string
  productSlug: string | null
  isNotified: boolean
  createdAt: string
  notifiedAt: string | null
}

export type MypageNotificationKind = 'restock' | 'inquiry' | 'notice'

export interface MypageNotificationItem {
  id: string
  kind: MypageNotificationKind
  title: string
  message: string
  createdAt: string
  href: string
  isUnread: boolean
}

export interface MypageStats {
  orderCount: number
  inquiryCount: number
  addressCount: number
  notificationCount: number
}

export interface MemberOrderStatusSummary {
  waitingPayment: number
  preparing: number
  shipping: number
  completed: number
}

export interface MemberOrderItem {
  id: string
  productId: string | null
  productSlug: string | null
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface MemberOrderDetail extends MemberOrderSummary {
  customerPhone: string
  customerEmail: string | null
  recipientName: string | null
  recipientPhone: string | null
  zipcode: string | null
  address1: string | null
  address2: string | null
  memo: string | null
  courier: string | null
  trackingNumber: string | null
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  items: MemberOrderItem[]
}

export interface RecentProductEntry {
  slug: string
  name: string
  thumbnail: string
  price: number
  viewedAt: string
}
