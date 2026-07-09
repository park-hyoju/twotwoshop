import {
  buildOptionGroupsPayload,
  formatOptionValuesInput,
  getVariantTotalStock,
  inferOptionGroupsFromVariants,
  normalizeAdminVariants,
  variantsFromLegacyRows,
} from '../lib/adminProductOptions'
import { createOptionGroupId } from '../types/productOptions'
import {
  EMPTY_PRODUCT_INFO,
  EMPTY_RETURN_INFO,
  EMPTY_SHIPPING_INFO,
  EMPTY_SIZE_GUIDE,
  EMPTY_SIZE_GUIDE_ROW,
} from '../lib/adminProductDetailDefaults'
import { migrateDetailMedia, serializeDetailMediaForDb } from '../lib/detailMedia'
import { buildIntroShortDescriptionFromForm } from '../components/admin/products/detail/detailContent/detailContent'
import { resolveProductCategory } from '../constants/productCategories'
import { buildProductCategoryPayload } from './productMapper'
import type { AdminProductDetailChangeSet } from '../components/admin/products/detail/editor/productSaveChanges'
import type {
  AdminProductDetailForm,
  AdminProductInfoFields,
  AdminProductOptionGroup,
  AdminProductVariant,
  AdminReturnInfoFields,
  AdminShippingInfoFields,
  AdminSizeGuide,
  AdminSizeGuideRow,
} from '../types/adminProductDetail'
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
  product_category?: string | null
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
  detail_media?: unknown
  is_new?: boolean | null
  is_best?: boolean | null
  is_sale?: boolean | null
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

function parseOptionGroups(value: unknown): AdminProductOptionGroup[] {
  if (!isRecord(value) || !Array.isArray(value.optionGroups)) {
    return []
  }

  return value.optionGroups
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const name = asString(item.name).trim()
      const values = Array.isArray(item.values)
        ? [...new Set(item.values.map((entry) => asString(entry).trim()).filter(Boolean))]
        : []

      if (!name) {
        return null
      }

      const storedId = asString(item.id).trim()

      return {
        id: storedId || createOptionGroupId(),
        name,
        valuesInput: formatOptionValuesInput(values),
      }
    })
    .filter((item): item is AdminProductOptionGroup => item !== null)
}

function parseVariants(value: unknown): AdminProductVariant[] {
  if (!Array.isArray(value)) {
    return []
  }

  const rows = value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const options =
        isRecord(item.options)
          ? Object.fromEntries(
              Object.entries(item.options)
                .map(([key, optionValue]) => [key.trim(), asString(optionValue).trim()])
                .filter(([key, optionValue]) => key && optionValue),
            )
          : undefined

      return {
        id: asString(item.id),
        color: asString(item.color),
        size: asString(item.size),
        stock: typeof item.stock === 'number' && Number.isFinite(item.stock) ? item.stock : 0,
        extraPrice:
          typeof item.extraPrice === 'number' && Number.isFinite(item.extraPrice)
            ? item.extraPrice
            : 0,
        sku: asString(item.sku),
        options,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return rows
}

function extractProductInfoFields(value: unknown): {
  optionGroups: AdminProductOptionGroup[]
  variants: AdminProductVariant[]
} {
  if (!isRecord(value)) {
    return { optionGroups: [], variants: [] }
  }

  const rawVariants = parseVariants(value.variants)
  let optionGroups = parseOptionGroups(value)

  if (optionGroups.length === 0 && rawVariants.length > 0) {
    const provisional = variantsFromLegacyRows(rawVariants, ['색상', '사이즈'])
    optionGroups = inferOptionGroupsFromVariants(provisional)
  }

  const groupNames = optionGroups.map((group) => group.name.trim()).filter(Boolean)
  const variants = normalizeAdminVariants(variantsFromLegacyRows(rawVariants, groupNames), groupNames)

  return { optionGroups, variants }
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
  const { optionGroups, variants } = extractProductInfoFields(row.product_info)

  return {
    id: row.id,
    name: row.name,
    slug,
    brand: row.brand ?? '',
    sku: row.sku ?? '',
    product_category: resolveProductCategory(row),
    status: asProductStatus(row.status),
    price: row.price,
    original_price: row.original_price ?? row.price,
    discount_rate: row.discount_rate ?? 0,
    stock: row.stock,
    thumbnail,
    images,
    short_description: row.short_description ?? '',
    description: row.description ?? '',
    detail_media: migrateDetailMedia(row.detail_media, row.short_description ?? '', images),
    size_guide: parseSizeGuide(row.size_guide),
    product_info: parseProductInfo(row.product_info),
    shipping_info: parseShippingInfo(row.shipping_info),
    return_info: parseReturnInfo(row.return_info),
    meta_title: row.meta_title ?? '',
    meta_description: row.meta_description ?? '',
    isNew: row.is_new === true,
    isBest: row.is_best === true,
    isSale: row.is_sale === true,
    optionGroups,
    variants,
  }
}

/** Updates only description tab fields — never touches options, stock, status, or pricing. */
export function mapAdminProductDetailFormToDescriptionUpdatePayload(
  form: AdminProductDetailForm,
) {
  return {
    description: form.description,
    short_description: buildIntroShortDescriptionFromForm(form),
    detail_media: serializeDetailMediaForDb(form.detail_media),
  }
}

export function mapAdminProductDetailFormToUpdatePayload(form: AdminProductDetailForm) {
  return mapAdminProductDetailFormToFullUpdatePayload(form)
}

function buildVariantsPayload(form: AdminProductDetailForm) {
  const optionGroups = buildOptionGroupsPayload(form.optionGroups)
  const groupNames = optionGroups.map((group) => group.name)

  return {
    optionGroups,
    variants: normalizeAdminVariants(form.variants, groupNames).map((variant) => ({
      id: variant.id,
      options: variant.options,
      stock: variant.stock,
      extraPrice: variant.extraPrice,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
    })),
  }
}

/** Builds a partial Supabase update — only fields flagged in `changes` are included. */
export function buildAdminProductDetailPartialUpdatePayload(
  baseline: AdminProductDetailForm,
  next: AdminProductDetailForm,
  changes: AdminProductDetailChangeSet,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if (changes.description) {
    Object.assign(payload, mapAdminProductDetailFormToDescriptionUpdatePayload(next))
  } else if (changes.detailMedia) {
    payload.detail_media = serializeDetailMediaForDb(next.detail_media)
    payload.short_description = buildIntroShortDescriptionFromForm(next)
  }

  if (changes.pricing) {
    payload.price = next.price
    payload.original_price = next.original_price
    payload.discount_rate = next.discount_rate
  }

  if (changes.simpleStock) {
    payload.stock = next.stock
  }

  if (changes.options) {
    const { optionGroups, variants } = buildVariantsPayload(next)
    payload.product_info = {
      ...baseline.product_info,
      optionGroups,
      variants,
    }
    payload.stock = getVariantTotalStock(next.variants)
  }

  if (changes.basicInfo) {
    const categoryFields = buildProductCategoryPayload(next.product_category)
    payload.name = next.name.trim()
    payload.slug = next.slug.trim()
    payload.brand = next.brand.trim() || null
    payload.sku = next.sku.trim() || null
    Object.assign(payload, categoryFields)
  }

  if (changes.status) {
    payload.status = next.status
  }

  if (changes.media) {
    payload.thumbnail = next.thumbnail.trim() || null
    payload.images = next.images
  }

  if (changes.shipping) {
    payload.shipping_info = next.shipping_info
    payload.return_info = next.return_info
    payload.size_guide = next.size_guide
  }

  if (changes.exposure) {
    payload.is_new = next.isNew === true
    payload.is_best = next.isBest === true
    payload.is_sale = next.isSale === true
  }

  return payload
}

// Legacy full payload helper (used by copy product)
export function mapAdminProductDetailFormToFullUpdatePayload(form: AdminProductDetailForm) {
  const categoryFields = buildProductCategoryPayload(form.product_category)
  const { optionGroups, variants } = buildVariantsPayload(form)

  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    brand: form.brand.trim() || null,
    sku: form.sku.trim() || null,
    ...categoryFields,
    status: form.status,
    price: form.price,
    original_price: form.original_price,
    discount_rate: form.discount_rate,
    stock: form.stock,
    thumbnail: form.thumbnail.trim() || null,
    images: form.images,
    short_description: buildIntroShortDescriptionFromForm(form),
    description: form.description,
    detail_media: serializeDetailMediaForDb(form.detail_media),
    size_guide: form.size_guide,
    product_info: {
      ...form.product_info,
      optionGroups,
      variants,
    },
    shipping_info: form.shipping_info,
    return_info: form.return_info,
    meta_title: form.meta_title.trim() || null,
    meta_description: form.meta_description.trim() || null,
    is_new: form.isNew === true,
    is_best: form.isBest === true,
    is_sale: form.isSale === true,
  }
}
