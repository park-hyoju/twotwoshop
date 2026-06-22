import type { AdminOrderSearchFilters } from '../types/adminOrder'
import { isDbOrderStatus } from './adminOrderStatus'

const EMPTY_FILTERS: AdminOrderSearchFilters = {
  orderNumber: '',
  customerName: '',
  phone: '',
  status: 'all',
}

export function createEmptyAdminOrderFilters(): AdminOrderSearchFilters {
  return { ...EMPTY_FILTERS }
}

export function parseAdminOrderFiltersFromSearchParams(
  searchParams: URLSearchParams,
): AdminOrderSearchFilters {
  const statusParam = searchParams.get('status')

  if (statusParam && isDbOrderStatus(statusParam)) {
    return {
      ...EMPTY_FILTERS,
      status: statusParam,
    }
  }

  return { ...EMPTY_FILTERS }
}
