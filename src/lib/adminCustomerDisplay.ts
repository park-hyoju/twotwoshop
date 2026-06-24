import type {
  CustomerGrade,
  CustomerMemberType,
  CustomerStatus,
} from '../types/adminCustomer'

export const CUSTOMER_GRADE_LABELS: Record<CustomerGrade, string> = {
  regular: '일반',
  loyal: '단골',
  vip: 'VIP',
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  normal: '정상',
  caution: '주의',
  blocked: '차단',
}

export const CUSTOMER_MEMBER_LABELS: Record<CustomerMemberType, string> = {
  member: '회원',
  guest: '비회원',
}

export const CUSTOMER_GRADE_BADGE_CLASSES: Record<CustomerGrade, string> = {
  regular: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  loyal: 'bg-blue-50 text-blue-700 ring-blue-200',
  vip: 'bg-amber-50 text-amber-800 ring-amber-200',
}

export const CUSTOMER_STATUS_BADGE_CLASSES: Record<CustomerStatus, string> = {
  normal: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  caution: 'bg-amber-50 text-amber-800 ring-amber-200',
  blocked: 'bg-red-50 text-red-700 ring-red-200',
}

export const CUSTOMER_MEMBER_BADGE_CLASSES: Record<CustomerMemberType, string> = {
  member: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  guest: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
}

export function getCustomerGradeLabel(grade: CustomerGrade): string {
  return CUSTOMER_GRADE_LABELS[grade]
}

export function getCustomerStatusLabel(status: CustomerStatus): string {
  return CUSTOMER_STATUS_LABELS[status]
}

export function getCustomerMemberLabel(memberType: CustomerMemberType): string {
  return CUSTOMER_MEMBER_LABELS[memberType]
}
