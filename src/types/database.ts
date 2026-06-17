import type { DetailCategory } from './detailCategory'
import type { DisplayCategory } from './displayCategory'
import type { Gender } from './gender'
import type { ProductStatus } from './status'

export interface ProductRow {
  id: string
  slug: string
  name: string
  short_description: string
  description: string
  price: number
  original_price: number
  discount_rate: number
  thumbnail: string
  images: string[]
  gender: Gender
  display_category: DisplayCategory
  detail_category: DetailCategory
  tags: string[]
  is_new: boolean
  is_best: boolean
  is_sale: boolean
  stock: number
  sold_out: boolean
  status: ProductStatus
  created_at: string
  updated_at: string
}

export interface CustomerRow {
  id?: string
  name: string
  phone: string
  postal_code: string
  address: string
  address_detail: string
  memo: string
  created_at?: string
}

export interface OrderItemRow {
  id?: string
  order_id?: string
  product_id: string
  slug: string
  name: string
  price: number
  quantity: number
  thumbnail: string
}

export interface OrderRow {
  id?: string
  order_number: string
  customer_name: string
  phone: string
  postal_code: string
  address: string
  address_detail: string
  memo: string
  product_total: number
  shipping_fee: number
  total_amount: number
  created_at: string
}
