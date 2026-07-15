import type { DbInquiryStatus, DbInquiryType, InquiryStatusFilter, InquiryTypeFilter } from '../types/adminInquiry'

export const INQUIRY_TYPE_OPTIONS: Array<{ value: DbInquiryType; label: string }> = [
  { value: 'shipping', label: '배송문의' },
  { value: 'exchange', label: '교환문의' },
  { value: 'refund', label: '환불문의' },
  { value: 'product', label: '상품문의' },
  { value: 'other', label: '기타문의' },
]

/** Customer/admin-facing statuses only. DB may still store in_progress / closed. */
export const INQUIRY_STATUS_OPTIONS: Array<{ value: DbInquiryStatus; label: string }> = [
  { value: 'pending', label: '답변 대기' },
  { value: 'answered', label: '답변 완료' },
]

const DB_INQUIRY_STATUSES: readonly DbInquiryStatus[] = [
  'pending',
  'in_progress',
  'answered',
  'closed',
]

const INQUIRY_TYPE_LABELS: Record<DbInquiryType, string> = {
  shipping: '배송문의',
  exchange: '교환문의',
  refund: '환불문의',
  product: '상품문의',
  other: '기타문의',
}

const INQUIRY_STATUS_LABELS: Record<DbInquiryStatus, string> = {
  pending: '답변 대기',
  in_progress: '답변 대기',
  answered: '답변 완료',
  closed: '답변 완료',
}

const LEGACY_STATUS_MAP: Record<string, DbInquiryStatus> = {
  completed: 'answered',
}

export const INQUIRY_TYPE_BADGE_CLASSES: Record<DbInquiryType, string> = {
  shipping: 'bg-blue-50 text-blue-700 ring-blue-200',
  exchange: 'bg-violet-50 text-violet-700 ring-violet-200',
  refund: 'bg-orange-50 text-orange-800 ring-orange-200',
  product: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  other: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
}

export const INQUIRY_STATUS_BADGE_CLASSES: Record<DbInquiryStatus, string> = {
  pending: 'bg-orange-50 text-orange-700 ring-orange-200/80',
  in_progress: 'bg-sky-50 text-sky-700 ring-sky-200/80',
  answered: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  closed: 'bg-neutral-100 text-neutral-600 ring-neutral-200/80',
}

export function normalizeInquiryStatus(status: string): DbInquiryStatus {
  if (isDbInquiryStatus(status)) {
    return status
  }

  return LEGACY_STATUS_MAP[status] ?? 'pending'
}

export function getInquiryTypeLabel(type: DbInquiryType): string {
  return INQUIRY_TYPE_LABELS[type]
}

export function getInquiryStatusLabel(status: DbInquiryStatus | string): string {
  return INQUIRY_STATUS_LABELS[normalizeInquiryStatus(status)]
}

export function isDbInquiryType(value: string): value is DbInquiryType {
  return INQUIRY_TYPE_OPTIONS.some((option) => option.value === value)
}

export function isDbInquiryStatus(value: string): value is DbInquiryStatus {
  return (DB_INQUIRY_STATUSES as readonly string[]).includes(value)
}

/** Maps DB status to the two statuses shown in admin UI selects. */
export function toInquiryStatusSelectValue(status: DbInquiryStatus | string): 'pending' | 'answered' {
  const normalized = normalizeInquiryStatus(status)
  return normalized === 'answered' || normalized === 'closed' ? 'answered' : 'pending'
}

export const INQUIRY_TYPE_FILTER_OPTIONS: Array<{ value: InquiryTypeFilter; label: string }> = [
  { value: 'all', label: '전체 유형' },
  ...INQUIRY_TYPE_OPTIONS,
]

export const INQUIRY_STATUS_FILTER_OPTIONS: Array<{ value: InquiryStatusFilter; label: string }> = [
  { value: 'all', label: '전체 상태' },
  ...INQUIRY_STATUS_OPTIONS,
]

export function getInquiryDisplayCode(inquiry: {
  inquiry_code?: string | null
  inquiry_number?: string | null
}): string {
  return inquiry.inquiry_code?.trim() || inquiry.inquiry_number?.trim() || '-'
}
