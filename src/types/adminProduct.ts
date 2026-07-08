import type { ProductCategoryId } from '../constants/productCategories'
import type { ProductStatus } from './status'

export type AdminProductStatusFilter = 'all' | ProductStatus

export interface AdminProductRow {
  id: string
  slug: string
  name: string
  price: number
  original_price: number
  discount_rate: number
  stock: number
  total_stock: number
  status: ProductStatus
  product_category: string | null
  display_category: string | null
  is_new: boolean
  is_best: boolean
  is_sale: boolean
  thumbnail: string | null
  description: string | null
  images: string[] | null
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
  description: string
}

export interface AdminProductFormFiles {
  thumbnail: File | null
  additionalImages: File[]
  /** 수정 시 서버에 유지할 추가 이미지 URL */
  retainedAdditionalUrls: string[]
  /** 수정 시 기존 대표 이미지 URL (새 파일 없을 때) */
  existingThumbnailUrl: string | null
}

export interface AdminProductUpdateInput {
  name: string
  slug: string
  price: number
  stock: number
  status: ProductStatus
  product_category: ProductCategoryId
  isNew: boolean
  isBest: boolean
  isSale: boolean
  description: string
  thumbnail: string
  images: string[]
}
