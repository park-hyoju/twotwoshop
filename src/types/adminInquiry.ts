export type DbInquiryType = 'shipping' | 'exchange' | 'refund' | 'product' | 'other'

export type DbInquiryStatus = 'pending' | 'in_progress' | 'completed'

export type InquiryTypeFilter = 'all' | DbInquiryType

export type InquiryStatusFilter = 'all' | DbInquiryStatus

export interface AdminInquirySearchFilters {
  query: string
  inquiryType: InquiryTypeFilter
  status: InquiryStatusFilter
}

export interface AdminInquiryRow {
  id: string
  inquiry_number: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  inquiry_type: DbInquiryType
  status: DbInquiryStatus
  message: string
  admin_reply: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
}

export interface AdminInquirySummaryStats {
  totalCount: number
  pendingCount: number
  todayCount: number
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

export interface AdminInquiryUpdateInput {
  id: string
  status: DbInquiryStatus
  adminReply: string
  adminNote: string
}
