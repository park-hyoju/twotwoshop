import type { AdminCustomerSearchFilters } from '../types/adminCustomer'

export const EMPTY_ADMIN_CUSTOMER_FILTERS: AdminCustomerSearchFilters = {
  query: '',
  memberType: 'all',
  grade: 'all',
  status: 'all',
  sort: 'recent_order',
}

export type CustomerQuickFilter =
  | 'all'
  | 'member'
  | 'guest'
  | 'regular'
  | 'loyal'
  | 'vip'
  | 'caution'
  | 'blocked'

export const CUSTOMER_QUICK_FILTER_OPTIONS: Array<{ value: CustomerQuickFilter; label: string }> =
  [
    { value: 'all', label: '전체' },
    { value: 'member', label: '회원' },
    { value: 'guest', label: '비회원' },
    { value: 'regular', label: '일반' },
    { value: 'loyal', label: '단골' },
    { value: 'vip', label: 'VIP' },
    { value: 'caution', label: '주의' },
    { value: 'blocked', label: '차단' },
  ]

export const CUSTOMER_SORT_OPTIONS: Array<{
  value: AdminCustomerSearchFilters['sort']
  label: string
}> = [
  { value: 'recent_order', label: '최근 주문순' },
  { value: 'total_amount', label: '총 구매금액 높은순' },
  { value: 'order_count', label: '주문횟수 많은순' },
]

export function getCustomerQuickFilter(filters: AdminCustomerSearchFilters): CustomerQuickFilter {
  if (filters.memberType === 'member') {
    return 'member'
  }

  if (filters.memberType === 'guest') {
    return 'guest'
  }

  if (filters.grade === 'regular') {
    return 'regular'
  }

  if (filters.grade === 'loyal') {
    return 'loyal'
  }

  if (filters.grade === 'vip') {
    return 'vip'
  }

  if (filters.status === 'caution') {
    return 'caution'
  }

  if (filters.status === 'blocked') {
    return 'blocked'
  }

  return 'all'
}

export function applyCustomerQuickFilter(
  quickFilter: CustomerQuickFilter,
): AdminCustomerSearchFilters {
  const base = { ...EMPTY_ADMIN_CUSTOMER_FILTERS }

  switch (quickFilter) {
    case 'member':
      return { ...base, memberType: 'member' }
    case 'guest':
      return { ...base, memberType: 'guest' }
    case 'regular':
      return { ...base, grade: 'regular' }
    case 'loyal':
      return { ...base, grade: 'loyal' }
    case 'vip':
      return { ...base, grade: 'vip' }
    case 'caution':
      return { ...base, status: 'caution' }
    case 'blocked':
      return { ...base, status: 'blocked' }
    case 'all':
    default:
      return base
  }
}
