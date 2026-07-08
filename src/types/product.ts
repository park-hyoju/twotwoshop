import type { DetailCategory } from './detailCategory'
import type { DisplayCategory } from './displayCategory'
import type { Gender } from './gender'
import type { ProductCategoryId } from '../constants/productCategories'
import type {
  ProductInfoFields,
  ProductReturnInfo,
  ProductShippingInfo,
  ProductSizeGuide,
} from './productDetail'
import type { DetailMediaItem } from './detailMedia'
import type { ProductStatus } from './status'

export interface ProductVariant {
  id: string
  color: string
  size: string
  stock: number
}

export interface Product {
  id: string
  slug: string
  name: string
  shortDescription: string
  description: string
  detailMedia: DetailMediaItem[]
  price: number
  originalPrice: number
  discountRate: number
  thumbnail: string
  images: string[]
  productCategory: ProductCategoryId
  gender: Gender
  displayCategory: DisplayCategory
  detailCategory: DetailCategory
  tags: string[]
  isNew: boolean
  isBest: boolean
  isSale: boolean
  stock: number
  soldOut: boolean
  createdAt: string
  updatedAt: string
  status: ProductStatus
  sizeGuide: ProductSizeGuide
  productInfo: ProductInfoFields
  shippingInfo: ProductShippingInfo
  returnInfo: ProductReturnInfo
  variants: ProductVariant[]
}
