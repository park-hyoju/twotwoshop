import type { ProductCategoryId } from '../constants/productCategories'
import type { DetailMediaItem } from './detailMedia'
import type { ProductStatus } from './status'

export interface AdminProductOptionGroup {
  id: string
  name: string
  valuesInput: string
}

export interface AdminProductVariant {
  id: string
  options: Record<string, string>
  stock: number
  extraPrice: number
  sku: string
  /** @deprecated cart/order legacy — synced from options on save */
  color: string
  /** @deprecated cart/order legacy — synced from options on save */
  size: string
}

export interface AdminSizeGuideRow {
  size: string
  total_length: string
  shoulder: string
  chest: string
  sleeve: string
  waist: string
  hip: string
  rise: string
  thigh: string
  hem: string
}

export interface AdminSizeGuide {
  rows: AdminSizeGuideRow[]
  model_info: string
}

export interface AdminProductInfoFields {
  material: string
  origin_country: string
  manufacturer: string
  care_instructions: string
  thickness: string
  stretch: string
  sheer: string
  lining: string
  fit: string
}

export interface AdminShippingInfoFields {
  shipping_fee: string
  delivery_period: string
  free_shipping_threshold: string
}

export interface AdminReturnInfoFields {
  exchange_period: string
  return_address: string
  notes: string
}

export interface AdminProductDetailForm {
  id: string
  name: string
  slug: string
  brand: string
  sku: string
  product_category: ProductCategoryId
  status: ProductStatus
  price: number
  original_price: number
  discount_rate: number
  stock: number
  thumbnail: string
  images: string[]
  short_description: string
  description: string
  detail_media: DetailMediaItem[]
  size_guide: AdminSizeGuide
  product_info: AdminProductInfoFields
  shipping_info: AdminShippingInfoFields
  return_info: AdminReturnInfoFields
  meta_title: string
  meta_description: string
  isNew: boolean
  isBest: boolean
  isSale: boolean
  optionGroups: AdminProductOptionGroup[]
  variants: AdminProductVariant[]
}

export type ProductSellerStep = 'photos' | 'info' | 'options' | 'description' | 'shipping'

/** @deprecated Use ProductSellerStep */
export type ProductDetailEditorTab = ProductSellerStep
