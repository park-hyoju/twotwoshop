import {
  normalizeProductCategoryId,
  syncLegacyCategoryFields,
  type ProductCategoryId,
} from '../constants/productCategories'
import { isProductSoldOut } from '../lib/productStock'
import { resolveProductDetailMedia } from '../lib/detailMedia'
import type { DetailCategory } from '../types/detailCategory'
import type { DisplayCategory } from '../types/displayCategory'
import type { Gender } from '../types/gender'
import type { Product } from '../types/product'
import type { ProductStatus } from '../types/status'
import { resolveProductImages, resolveProductThumbnail } from '../lib/productImages'
import {
  parseProductInfoFields,
  parseProductReturnInfo,
  parseProductShippingInfo,
  parseProductSizeGuide,
} from '../lib/productDetailContent'
import {
  inferOptionGroupsFromVariants,
  parseOptionGroupsFromProductInfo,
  parseProductVariants,
} from '../lib/productVariants'

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
  product_category?: string | null
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
  detail_media?: unknown
}

function asGender(value: string | null | undefined): Gender {
  if (value === 'women' || value === 'men' || value === 'common' || value === 'perfume') {
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
    'skirt',
    'dress',
    'sneakers',
    'loafers',
    'bag',
    'belt',
    'wallet',
    'cap',
    'accessory',
    'socks',
    'etc',
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
  const variants = parseProductVariants(row.product_info)
  const parsedGroups = parseOptionGroupsFromProductInfo(row.product_info)
  const optionGroups = parsedGroups.length > 0 ? parsedGroups : inferOptionGroupsFromVariants(variants)
  const productCategory = normalizeProductCategoryId(row.product_category, row)
  const legacy = syncLegacyCategoryFields(productCategory)

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? '',
    description: row.description ?? '',
    detailMedia: resolveProductDetailMedia(row.detail_media, row.short_description ?? '', images),
    price: row.price,
    originalPrice: row.original_price ?? row.price,
    discountRate: row.discount_rate ?? 0,
    thumbnail,
    images,
    productCategory,
    gender: asGender(row.gender ?? legacy.gender),
    displayCategory: asDisplayCategory(row.display_category ?? legacy.display_category),
    detailCategory: asDetailCategory(row.detail_category ?? legacy.detail_category),
    tags: row.tags ?? [],
    isNew: row.is_new ?? false,
    isBest: row.is_best ?? false,
    isSale: row.is_sale ?? false,
    stock,
    soldOut: isProductSoldOut({ stock, status, variants }),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status,
    sizeGuide: parseProductSizeGuide(row.size_guide),
    productInfo: parseProductInfoFields(row.product_info),
    shippingInfo: parseProductShippingInfo(row.shipping_info),
    returnInfo: parseProductReturnInfo(row.return_info),
    optionGroups,
    variants,
  }
}

export function mapProductToProductRow(
  product: Product,
  displayOrder = 0,
): Omit<ProductRow, 'id' | 'created_at' | 'updated_at'> {
  const legacy = syncLegacyCategoryFields(product.productCategory)

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
    product_category: product.productCategory,
    gender: legacy.gender,
    display_category: legacy.display_category,
    detail_category: legacy.detail_category,
    tags: product.tags,
    is_new: product.isNew,
    is_best: product.isBest,
    is_sale: product.isSale,
    stock: product.stock,
    display_order: displayOrder,
    status: product.status,
  }
}

export function enrichProduct(product: Product): Product {
  const productCategory =
    normalizeProductCategoryId(product.productCategory, {
      gender: product.gender,
      display_category: product.displayCategory,
      detail_category: product.detailCategory,
    })

  const stock = product.stock ?? 0

  return {
    ...product,
    productCategory,
    optionGroups: product.optionGroups ?? inferOptionGroupsFromVariants(product.variants ?? []),
    variants: product.variants ?? [],
    detailMedia: product.detailMedia ?? [],
    soldOut: isProductSoldOut({
      stock,
      status: product.status,
      variants: product.variants,
    }),
  }
}

export function buildProductCategoryPayload(categoryId: ProductCategoryId) {
  return syncLegacyCategoryFields(categoryId)
}
