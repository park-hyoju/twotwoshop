import type { ProductCategoryId } from '../constants/productCategories'
import type { ProductStatus } from './status'

export type AdminProductStatusFilter = 'all' | ProductStatus

export interface AdminProductRow {
  id: string
  slug: string
  name: string
  price: number
  stock: number
  status: ProductStatus
  product_category: string | null
  display_category: string | null
  is_new: boolean
  is_best: boolean
  is_sale: boolean
  created_at: string
}

export interface AdminProductSearchFilters {
  name: string
  slug: string
  status: AdminProductStatusFilter
  category: 'all' | ProductCategoryId
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
  product_category: ProductCategoryId
  isNew: boolean
  isBest: boolean
  isSale: boolean
  relatedProductIds: string[]
}

export interface AdminProductUpdateInput {
  price: number
  stock: number
  status: ProductStatus
  product_category: ProductCategoryId
  isNew: boolean
  isBest: boolean
  isSale: boolean
}
