import type { DisplayCategory } from './displayCategory'
import type { Gender } from './gender'
import type { ProductStatus } from './status'

export type AdminProductStatusFilter = 'all' | ProductStatus

export interface AdminProductRow {
  id: string
  slug: string
  name: string
  price: number
  stock: number
  status: ProductStatus
  display_category: string | null
  created_at: string
}

export interface AdminProductSearchFilters {
  name: string
  slug: string
  status: AdminProductStatusFilter
}

export interface AdminProductsQueryParams {
  page: number
  pageSize: number
  filters: AdminProductSearchFilters
}

export interface AdminProductsQueryResult {
  products: AdminProductRow[]
  totalCount: number
}

export interface AdminProductFormInput {
  slug: string
  name: string
  price: number
  stock: number
  status: ProductStatus
  display_category: DisplayCategory
  gender: Gender
}

export interface AdminProductUpdateInput {
  price: number
  stock: number
  status: ProductStatus
  display_category: DisplayCategory
}
