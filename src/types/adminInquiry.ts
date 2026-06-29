export type DbInquiryType = 'shipping' | 'exchange' | 'refund' | 'product' | 'other'

export type DbInquiryStatus = 'pending' | 'in_progress' | 'answered' | 'closed'

export type InquiryTypeFilter = 'all' | DbInquiryType

export type InquiryStatusFilter = 'all' | DbInquiryStatus

export interface AdminInquirySearchFilters {
  query: string
  inquiryType: InquiryTypeFilter
  status: InquiryStatusFilter
}

export interface AdminInquiryMessageRow {
  id: string
  sender: 'customer' | 'admin'
  message: string
  image_urls: string[]
  created_at: string
  read_at?: string | null
}

export interface AdminInquiryRow {
  id: string
  inquiry_code: string
  inquiry_number: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  inquiry_type: DbInquiryType
  status: DbInquiryStatus
  message: string
  admin_reply: string | null
  admin_note: string | null
  image_urls: string[]
  order_reference: string | null
  admin_read_at: string | null
  customer_read_at: string | null
  admin_unread_count: number
  has_unread_for_admin: boolean
  created_at: string
  updated_at: string
  messages?: AdminInquiryMessageRow[]
}

export interface AdminInquirySummaryStats {
  totalCount: number
  pendingCount: number
  answeredCount: number
  todayCount: number
  unreadCount: number
}

export interface AdminInquiriesQueryParams {
  page: number
  pageSize: number
  filters: AdminInquirySearchFilters
}

export interface AdminInquiriesQueryResult {
  inquiries: AdminInquiryRow[]
  totalCount: number
}

export interface AdminInquirySendMessageInput {
  id: string
  message: string
  status: DbInquiryStatus
}

export interface AdminInquiryMetaUpdateInput {
  id: string
  status: DbInquiryStatus
  adminNote: string
}

export interface AdminInquiryUpdateInput {
  id: string
  status: DbInquiryStatus
  adminReply: string
  adminNote: string
}
