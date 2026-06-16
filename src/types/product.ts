export type ProductStatus = 'active' | 'soldout' | 'hidden'

export type ProductGender = 'women' | 'men' | 'common'

export type ProductCategory = 'top' | 'bottom' | 'dress' | 'shoes' | 'misc'

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  originalPrice: number
  discountRate: number
  imageUrl: string
  imageAlt: string
  category: ProductCategory
  gender: ProductGender
  tags: string[]
  isNew: boolean
  isBest: boolean
  isSale: boolean
  stock: number
  status: ProductStatus
  createdAt: string
}
