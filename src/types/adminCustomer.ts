import type { DbOrderStatus } from './adminOrder'

export type CustomerMemberType = 'member' | 'guest'

export type CustomerGrade = 'regular' | 'loyal' | 'vip'

export type CustomerStatus = 'normal' | 'caution' | 'blocked'

export type CustomerMemberFilter = 'all' | CustomerMemberType

export type CustomerGradeFilter = 'all' | CustomerGrade

export type CustomerStatusFilter = 'all' | CustomerStatus

export type CustomerSortOption = 'recent_order' | 'total_amount' | 'order_count'

export interface AdminCustomerSearchFilters {
  query: string
  memberType: CustomerMemberFilter
  grade: CustomerGradeFilter
  status: CustomerStatusFilter
  sort: CustomerSortOption
}

export interface AdminCustomerRow {
  groupKey: string
  primaryCustomerId: string | null
  linkedCustomerIds: string[]
  name: string
  phone: string
  email: string | null
  memberType: CustomerMemberType
  grade: CustomerGrade
  status: CustomerStatus
  orderCount: number
  totalPurchaseAmount: number
  firstOrderAt: string
  lastOrderAt: string
  lastOrderStatus: DbOrderStatus
  shippingAddress: string | null
  adminNote: string | null
}

export interface AdminCustomerOrderRow {
  id: string
  orderNumber: string
  createdAt: string
  productLabel: string
  totalAmount: number
  status: DbOrderStatus
}

export interface AdminCustomerDetail extends AdminCustomerRow {
  orders: AdminCustomerOrderRow[]
}

export interface AdminCustomersQueryParams {
  page: number
  pageSize: number
  filters: AdminCustomerSearchFilters
}

export interface AdminCustomersQueryResult {
  customers: AdminCustomerRow[]
  totalCount: number
}

export interface AdminCustomerUpdateInput {
  groupKey: string
  linkedCustomerIds: string[]
  phone: string
  adminNote: string
  customerStatus: CustomerStatus
}
