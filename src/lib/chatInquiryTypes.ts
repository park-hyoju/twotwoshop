import type { DbInquiryType } from '../types/adminInquiry'

export type ChatInquiryQuickKey =
  | 'shipping'
  | 'exchange'
  | 'refund'
  | 'product'
  | 'payment'
  | 'custom'

export interface ChatQuickInquiryOption {
  key: ChatInquiryQuickKey
  label: string
  icon: string
}

export const CHAT_QUICK_INQUIRIES: ChatQuickInquiryOption[] = [
  { key: 'shipping', label: '배송문의', icon: '📦' },
  { key: 'exchange', label: '교환안내', icon: '🔄' },
  { key: 'refund', label: '환불안내', icon: '💰' },
  { key: 'product', label: '상품문의', icon: '👕' },
  { key: 'payment', label: '입금안내', icon: '💳' },
  { key: 'custom', label: '기타안내', icon: '💬' },
]

export function mapQuickKeyToDbInquiryType(key: ChatInquiryQuickKey): DbInquiryType {
  switch (key) {
    case 'shipping':
      return 'shipping'
    case 'exchange':
      return 'exchange'
    case 'refund':
      return 'refund'
    case 'product':
      return 'product'
    case 'payment':
    case 'custom':
    default:
      return 'other'
  }
}

export function getQuickInquiryLabel(key: ChatInquiryQuickKey): string {
  return CHAT_QUICK_INQUIRIES.find((item) => item.key === key)?.label ?? '문의'
}
