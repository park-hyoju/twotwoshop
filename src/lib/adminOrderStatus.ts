import type { DbOrderStatus } from '../types/adminOrder'

export const ORDER_STATUS_OPTIONS: Array<{ value: DbOrderStatus; label: string }> = [
  { value: 'pending', label: '주문접수' },
  { value: 'paid', label: '결제확인' },
  { value: 'confirmed', label: '배송준비' },
  { value: 'shipped', label: '배송중' },
  { value: 'completed', label: '배송완료' },
  { value: 'cancelled', label: '취소' },
]

const ORDER_STATUS_LABELS: Record<DbOrderStatus, string> = {
  pending: '주문접수',
  paid: '결제확인',
  confirmed: '배송준비',
  shipped: '배송중',
  completed: '배송완료',
  cancelled: '취소',
}

const ORDER_STATUS_BADGE_CLASSES: Record<DbOrderStatus, string> = {
  pending: 'bg-blue-50 text-blue-700 ring-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  confirmed: 'bg-amber-50 text-amber-800 ring-amber-200',
  shipped: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  completed: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

export function getOrderStatusLabel(status: DbOrderStatus): string {
  return ORDER_STATUS_LABELS[status]
}

export function getOrderStatusBadgeClassName(status: DbOrderStatus): string {
  return ORDER_STATUS_BADGE_CLASSES[status]
}

export function isDbOrderStatus(value: string): value is DbOrderStatus {
  return ORDER_STATUS_OPTIONS.some((option) => option.value === value)
}

export const ORDER_STATUS_FILTER_OPTIONS: Array<{
  value: 'all' | DbOrderStatus
  label: string
}> = [{ value: 'all', label: '전체' }, ...ORDER_STATUS_OPTIONS]
