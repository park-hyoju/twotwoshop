import {
  EMPTY_PRODUCT_INFO,
  EMPTY_RETURN_INFO,
  EMPTY_SHIPPING_INFO,
  EMPTY_SIZE_GUIDE,
  EMPTY_SIZE_GUIDE_ROW,
} from '../lib/adminProductDetailDefaults'
import type { DetailCategory } from '../types/detailCategory'
import type { DisplayCategory } from '../types/displayCategory'
import type {
  AdminProductDetailForm,
  AdminProductInfoFields,
  AdminReturnInfoFields,
  AdminShippingInfoFields,
  AdminSizeGuide,
  AdminSizeGuideRow,
} from '../types/adminProductDetail'
import type { Gender } from '../types/gender'
import type { ProductStatus } from '../types/status'

export interface AdminProductDetailRow {
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
  stock: number
  status: string
  brand: string | null
  sku: string | null
  meta_title: string | null
  meta_description: string | null
  size_guide: unknown
  product_info: unknown
  shipping_info: unknown
  return_info: unknown
}

function asDisplayCategory(value: string | null | undefined): DisplayCategory {
  const categories: DisplayCategory[] = ['top', 'bottom', 'dress', 'shoes', 'misc']
  return categories.includes(value as DisplayCategory) ? (value as DisplayCategory) : 'misc'
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
    'skirt',
    'socks',
    'etc',
  ]
  return categories.includes(value as DetailCategory) ? (value as DetailCategory) : 'accessory'
}

function asGender(value: string | null | undefined): Gender {
  if (value === 'women' || value === 'men' || value === 'common') {
    return value
  }
  return 'common'
}

function asProductStatus(value: string | null | undefined): ProductStatus {
  if (value === 'active' || value === 'hidden' || value === 'soldout') {
    return value
  }
  return 'active'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function parseSizeGuideRow(value: unknown): AdminSizeGuideRow {
  if (!isRecord(value)) {
    return { ...EMPTY_SIZE_GUIDE_ROW }
  }

  return {
    size: asString(value.size),
    total_length: asString(value.total_length),
    shoulder: asString(value.shoulder),
    chest: asString(value.chest),
    sleeve: asString(value.sleeve),
    waist: asString(value.waist),
    hip: asString(value.hip),
    rise: asString(value.rise),
    thigh: asString(value.thigh),
    hem: asString(value.hem),
  }
}

function parseSizeGuide(value: unknown): AdminSizeGuide {
  if (!isRecord(value)) {
    return { ...EMPTY_SIZE_GUIDE, rows: [] }
  }

  const rows = Array.isArray(value.rows)
    ? value.rows.map((row) => parseSizeGuideRow(row))
    : []

  return {
    rows,
    model_info: asString(value.model_info),
  }
}

function parseProductInfo(value: unknown): AdminProductInfoFields {
  if (!isRecord(value)) {
    return { ...EMPTY_PRODUCT_INFO }
  }

  return {
    material: asString(value.material),
    origin_country: asString(value.origin_country),
    manufacturer: asString(value.manufacturer),
    care_instructions: asString(value.care_instructions),
    thickness: asString(value.thickness),
    stretch: asString(value.stretch),
    sheer: asString(value.sheer),
    lining: asString(value.lining),
    fit: asString(value.fit),
  }
}

function parseShippingInfo(value: unknown): AdminShippingInfoFields {
  if (!isRecord(value)) {
    return { ...EMPTY_SHIPPING_INFO }
  }

  return {
    shipping_fee: asString(value.shipping_fee),
    delivery_period: asString(value.delivery_period),
    free_shipping_threshold: asString(value.free_shipping_threshold),
  }
}

function parseReturnInfo(value: unknown): AdminReturnInfoFields {
  if (!isRecord(value)) {
    return { ...EMPTY_RETURN_INFO }
  }

  return {
    exchange_period: asString(value.exchange_period),
    return_address: asString(value.return_address),
    notes: asString(value.notes),
  }
}

function placeholderImage(slug: string): string {
  return `/images/placeholder/${slug}.jpg`
}

export function mapRowToAdminProductDetailForm(row: AdminProductDetailRow): AdminProductDetailForm {
  const slug = row.slug
  const thumbnail = row.thumbnail ?? placeholderImage(slug)
  const images = row.images && row.images.length > 0 ? row.images : [thumbnail]

  return {
    id: row.id,
    name: row.name,
    slug,
    brand: row.brand ?? '',
    sku: row.sku ?? '',
    display_category: asDisplayCategory(row.display_category),
    detail_category: asDetailCategory(row.detail_category),
    gender: asGender(row.gender),
    status: asProductStatus(row.status),
    price: row.price,
    original_price: row.original_price ?? row.price,
    discount_rate: row.discount_rate ?? 0,
    stock: row.stock,
    thumbnail,
    images,
    short_description: row.short_description ?? '',
    description: row.description ?? '',
    size_guide: parseSizeGuide(row.size_guide),
    product_info: parseProductInfo(row.product_info),
    shipping_info: parseShippingInfo(row.shipping_info),
    return_info: parseReturnInfo(row.return_info),
    meta_title: row.meta_title ?? '',
    meta_description: row.meta_description ?? '',
  }
}

export function mapAdminProductDetailFormToUpdatePayload(form: AdminProductDetailForm) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    brand: form.brand.trim() || null,
    sku: form.sku.trim() || null,
    display_category: form.display_category,
    detail_category: form.detail_category,
    gender: form.gender,
    status: form.status,
    price: form.price,
    original_price: form.original_price,
    discount_rate: form.discount_rate,
    stock: form.stock,
    thumbnail: form.thumbnail.trim() || null,
    images: form.images,
    short_description: form.short_description.trim() || null,
    description: form.description,
    size_guide: form.size_guide,
    product_info: form.product_info,
    shipping_info: form.shipping_info,
    return_info: form.return_info,
    meta_title: form.meta_title.trim() || null,
    meta_description: form.meta_description.trim() || null,
  }
}
