import type { DetailCategory } from '../types/detailCategory'
import type { DisplayCategory } from '../types/displayCategory'
import type { Gender } from '../types/gender'
import type { Product } from '../types/product'
import type { ProductStatus } from '../types/status'
import { PRODUCTS } from '../data/products'
import { resolveProductImages, resolveProductThumbnail } from '../lib/productImages'
import {
  parseProductInfoFields,
  parseProductReturnInfo,
  parseProductShippingInfo,
  parseProductSizeGuide,
} from '../lib/productDetailContent'

/** Cart sync(v0.8 Step 4)는 static id 기준이므로 slug가 같으면 기존 id를 유지합니다. */
const staticProductIdBySlug = new Map(
  PRODUCTS.map((product) => [product.slug, product.id]),
)

/** Supabase `public.products` row shape (snake_case). */
export interface ProductRow {
  id: string
  slug: string
  name: string
  short_description: string | null
  description: string | null
  price: number
  original_price: number | null
  discount_rate: number | null
  thumbnail: string | null
  images: string[] | null
  gender: string | null
  display_category: string | null
  detail_category: string | null
  tags: string[] | null
  is_new: boolean
  is_best: boolean
  is_sale: boolean
  stock: number
  display_order: number
  status: string
  created_at: string
  updated_at: string
  size_guide?: unknown
  product_info?: unknown
  shipping_info?: unknown
  return_info?: unknown
}

function asGender(value: string | null | undefined): Gender {
  if (value === 'women' || value === 'men' || value === 'common') {
    return value
  }
  return 'common'
}

function asDisplayCategory(value: string | null | undefined): DisplayCategory {
  const categories: DisplayCategory[] = ['top', 'bottom', 'dress', 'shoes', 'misc']
  return categories.includes(value as DisplayCategory)
    ? (value as DisplayCategory)
    : 'misc'
}

function asDetailCategory(value: string | null | undefined): DetailCategory {
  const categories: DetailCategory[] = [
    'shirt',
    'knit',
    'hoodie',
    'tshirt',
    'pants',
    'dress',
    'sneakers',
    'loafers',
    'bag',
    'belt',
    'wallet',
    'cap',
    'accessory',
  ]
  return categories.includes(value as DetailCategory)
    ? (value as DetailCategory)
    : 'accessory'
}

function asProductStatus(value: string | null | undefined): ProductStatus {
  if (value === 'active' || value === 'hidden' || value === 'soldout') {
    return value
  }
  return 'active'
}

export function mapProductRowToProduct(row: ProductRow): Product {
  const thumbnail = resolveProductThumbnail(row.thumbnail, row.slug)
  const images = resolveProductImages(row.images, row.thumbnail, row.slug)
  const status = asProductStatus(row.status)
  const stock = row.stock ?? 0

  return {
    id: staticProductIdBySlug.get(row.slug) ?? row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? '',
    description: row.description ?? '',
    price: row.price,
    originalPrice: row.original_price ?? row.price,
    discountRate: row.discount_rate ?? 0,
    thumbnail,
    images,
    gender: asGender(row.gender),
    displayCategory: asDisplayCategory(row.display_category),
    detailCategory: asDetailCategory(row.detail_category),
    tags: row.tags ?? [],
    isNew: row.is_new,
    isBest: row.is_best,
    isSale: row.is_sale,
    stock,
    soldOut: status === 'soldout' || stock <= 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status,
    sizeGuide: parseProductSizeGuide(row.size_guide),
    productInfo: parseProductInfoFields(row.product_info),
    shippingInfo: parseProductShippingInfo(row.shipping_info),
    returnInfo: parseProductReturnInfo(row.return_info),
  }
}

export function mapProductToProductRow(
  product: Product,
  displayOrder = 0,
): Omit<ProductRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    slug: product.slug,
    name: product.name,
    short_description: product.shortDescription,
    description: product.description,
    price: product.price,
    original_price: product.originalPrice,
    discount_rate: product.discountRate,
    thumbnail: product.thumbnail,
    images: product.images,
    gender: product.gender,
    display_category: product.displayCategory,
    detail_category: product.detailCategory,
    tags: product.tags,
    is_new: product.isNew,
    is_best: product.isBest,
    is_sale: product.isSale,
    stock: product.stock,
    display_order: displayOrder,
    status: product.status,
  }
}
