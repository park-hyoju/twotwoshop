import type { DbInquiryStatus, DbInquiryType } from './adminInquiry'

export type InquiryMessageSender = 'customer' | 'admin'

export interface CustomerInquiryMessage {
  id: string
  sender: InquiryMessageSender
  message: string
  image_urls: string[]
  created_at: string
}

export interface CustomerInquiryThread {
  id: string
  inquiry_code: string
  name: string
  phone: string
  email: string | null
  type: DbInquiryType
  status: DbInquiryStatus
  message: string
  admin_reply: string | null
  image_urls: string[]
  order_reference: string | null
  created_at: string
  updated_at: string
  messages: CustomerInquiryMessage[]
}

export interface CustomerInquirySummary {
  id: string
  type: DbInquiryType
  status: DbInquiryStatus
  message: string
  image_urls: string[]
  created_at: string
  updated_at: string
}

export interface CustomerInquiryLookupInput {
  name: string
  phone: string
}

export interface CustomerInquiryIdentity {
  inquiryId: string
  name: string
  phone: string
}
