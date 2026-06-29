import type { DbOrderStatus, DbPaymentStatus } from '../types/adminOrder'

export type NormalizedOrderStatus = Exclude<
  DbOrderStatus,
  'pending' | 'paid' | 'confirmed' | 'shipped' | 'completed' | 'deposit_confirmed'
>

const LEGACY_STATUS_MAP: Record<string, NormalizedOrderStatus> = {
  pending: 'pending_payment',
  paid: 'payment_confirmed',
  deposit_confirmed: 'payment_confirmed',
  confirmed: 'preparing',
  shipped: 'shipping',
  completed: 'delivered',
}

const LEGACY_PAYMENT_STATUS_MAP: Record<string, DbPaymentStatus> = {
  deposit_confirmed: 'paid',
  cancelled: 'refunded',
}

export const ORDER_STATUS_OPTIONS: Array<{ value: NormalizedOrderStatus; label: string }> = [
  { value: 'pending_payment', label: '입금대기' },
  { value: 'payment_confirmed', label: '입금확인' },
  { value: 'preparing', label: '배송준비' },
  { value: 'shipping', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancel_requested', label: '취소요청' },
  { value: 'cancelled', label: '취소완료' },
]

const ORDER_STATUS_LABELS: Record<NormalizedOrderStatus, string> = {
  pending_payment: '입금대기',
  payment_confirmed: '입금확인',
  preparing: '배송준비',
  shipping: '배송중',
  delivered: '배송완료',
  cancel_requested: '취소요청',
  cancelled: '취소완료',
}

const ORDER_STATUS_BADGE_CLASSES: Record<NormalizedOrderStatus, string> = {
  pending_payment: 'bg-blue-50 text-blue-700 ring-blue-200',
  payment_confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  preparing: 'bg-amber-50 text-amber-800 ring-amber-200',
  shipping: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  delivered: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  cancel_requested: 'bg-orange-50 text-orange-700 ring-orange-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

const PAYMENT_STATUS_LABELS: Record<DbPaymentStatus, string> = {
  waiting_deposit: '입금대기',
  paid: '입금확인',
  refunded: '환불완료',
}

export function normalizeOrderStatus(status: string): NormalizedOrderStatus {
  if (status in LEGACY_STATUS_MAP) {
    return LEGACY_STATUS_MAP[status]
  }

  return status as NormalizedOrderStatus
}

export function normalizePaymentStatus(status: string): DbPaymentStatus {
  if (status in LEGACY_PAYMENT_STATUS_MAP) {
    return LEGACY_PAYMENT_STATUS_MAP[status]
  }

  if (status === 'waiting_deposit' || status === 'paid' || status === 'refunded') {
    return status
  }

  return 'waiting_deposit'
}

export function inferPaymentStatus(
  orderStatus: string,
  paymentStatus?: string | null,
): DbPaymentStatus {
  const normalizedPayment = paymentStatus
    ? normalizePaymentStatus(paymentStatus)
    : 'waiting_deposit'

  if (normalizedPayment === 'paid' || normalizedPayment === 'refunded') {
    return normalizedPayment
  }

  const normalizedOrder = normalizeOrderStatus(orderStatus)
  if (normalizedOrder === 'cancelled' || normalizedOrder === 'cancel_requested') {
    return 'refunded'
  }

  if (normalizedOrder !== 'pending_payment') {
    return 'paid'
  }

  return 'waiting_deposit'
}

export function getOrderStatusLabel(status: DbOrderStatus | string): string {
  return ORDER_STATUS_LABELS[normalizeOrderStatus(status)]
}

export function getOrderStatusBadgeClassName(status: DbOrderStatus | string): string {
  return ORDER_STATUS_BADGE_CLASSES[normalizeOrderStatus(status)]
}

export function getPaymentStatusLabel(status: DbPaymentStatus | string): string {
  return PAYMENT_STATUS_LABELS[normalizePaymentStatus(status)]
}

export function isDbOrderStatus(value: string): value is DbOrderStatus {
  return (
    ORDER_STATUS_OPTIONS.some((option) => option.value === value) ||
    value in LEGACY_STATUS_MAP ||
    value === 'cancel_requested' ||
    value === 'cancelled'
  )
}

export const ORDER_STATUS_FILTER_OPTIONS: Array<{
  value: 'all' | NormalizedOrderStatus
  label: string
}> = [{ value: 'all', label: '전체' }, ...ORDER_STATUS_OPTIONS]

export const ORDER_STATUS_TIMELINE: NormalizedOrderStatus[] = [
  'pending_payment',
  'payment_confirmed',
  'preparing',
  'shipping',
  'delivered',
]

export function getOrderTimelineIndex(status: DbOrderStatus | string): number {
  const normalized = normalizeOrderStatus(status)
  if (normalized === 'cancel_requested' || normalized === 'cancelled') {
    return -1
  }

  return ORDER_STATUS_TIMELINE.indexOf(normalized)
}
