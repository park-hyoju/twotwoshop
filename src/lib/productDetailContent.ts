import {
  EMPTY_PRODUCT_INFO,
  EMPTY_PRODUCT_RETURN_INFO,
  EMPTY_PRODUCT_SHIPPING_INFO,
  EMPTY_PRODUCT_SIZE_GUIDE,
  EMPTY_PRODUCT_SIZE_GUIDE_ROW,
  type ProductInfoFields,
  type ProductReturnInfo,
  type ProductShippingInfo,
  type ProductSizeGuide,
  type ProductSizeGuideRow,
} from '../types/productDetail'
import { getProductDescriptionPlainText, isFormattedProductDescription } from './productDescriptionFormat'
import { isProductIntroPayload, isRawJsonDescription } from './productIntroContent'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function parseSizeGuideRow(value: unknown): ProductSizeGuideRow {
  if (!isRecord(value)) {
    return { ...EMPTY_PRODUCT_SIZE_GUIDE_ROW }
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

export function parseProductSizeGuide(value: unknown): ProductSizeGuide {
  if (!isRecord(value)) {
    return { ...EMPTY_PRODUCT_SIZE_GUIDE, rows: [] }
  }

  const rows = Array.isArray(value.rows)
    ? value.rows.map((row) => parseSizeGuideRow(row))
    : []

  return {
    rows,
    model_info: asString(value.model_info),
  }
}

export function parseProductInfoFields(value: unknown): ProductInfoFields {
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

export function parseProductShippingInfo(value: unknown): ProductShippingInfo {
  if (!isRecord(value)) {
    return { ...EMPTY_PRODUCT_SHIPPING_INFO }
  }

  return {
    shipping_fee: asString(value.shipping_fee),
    delivery_period: asString(value.delivery_period),
    free_shipping_threshold: asString(value.free_shipping_threshold),
    additional_notes: asString(value.additional_notes),
  }
}

export function parseProductReturnInfo(value: unknown): ProductReturnInfo {
  if (!isRecord(value)) {
    return { ...EMPTY_PRODUCT_RETURN_INFO }
  }

  const legacyNotes = asString(value.notes)

  return {
    exchange_period: asString(value.exchange_period),
    return_address: asString(value.return_address),
    eligible_cases: asString(value.eligible_cases) || legacyNotes,
    ineligible_cases: asString(value.ineligible_cases),
    shipping_fee_notes: asString(value.shipping_fee_notes),
  }
}

export function hasProductSizeGuide(sizeGuide: ProductSizeGuide): boolean {
  if (sizeGuide.model_info.trim()) {
    return true
  }

  return sizeGuide.rows.some((row) =>
    Object.values(row).some((value) => value.trim().length > 0),
  )
}

export function hasProductInfoFields(productInfo: ProductInfoFields): boolean {
  return Object.values(productInfo).some((value) => value.trim().length > 0)
}

export function hasShippingInfoContent(shippingInfo: ProductShippingInfo): boolean {
  return Object.values(shippingInfo).some((value) => value.trim().length > 0)
}

export function hasReturnInfoContent(returnInfo: ProductReturnInfo): boolean {
  return Object.values(returnInfo).some((value) => value.trim().length > 0)
}

export function getProductDescriptionText(
  shortDescription: string,
  description: string,
): string {
  if (isFormattedProductDescription(description)) {
    return getProductDescriptionPlainText(description)
  }

  const text = description.trim()
  if (text && text !== ' ' && !isRawJsonDescription(text)) {
    return text
  }

  const shortText = shortDescription.trim()
  if (!shortText || isProductIntroPayload(shortText) || isRawJsonDescription(shortText)) {
    return ''
  }

  return shortText
}

export const PRODUCT_INFO_LABELS: Array<{ key: keyof ProductInfoFields; label: string }> = [
  { key: 'material', label: '소재' },
  { key: 'origin_country', label: '제조국' },
  { key: 'manufacturer', label: '제조사' },
  { key: 'care_instructions', label: '세탁방법' },
  { key: 'thickness', label: '두께감' },
  { key: 'stretch', label: '신축성' },
  { key: 'sheer', label: '비침' },
  { key: 'lining', label: '안감' },
  { key: 'fit', label: '핏' },
]

export const SIZE_GUIDE_COLUMNS: Array<{
  key: keyof ProductSizeGuideRow
  label: string
}> = [
  { key: 'size', label: '사이즈' },
  { key: 'total_length', label: '총장' },
  { key: 'shoulder', label: '어깨' },
  { key: 'chest', label: '가슴' },
  { key: 'sleeve', label: '소매' },
  { key: 'waist', label: '허리' },
  { key: 'hip', label: '엉덩이' },
  { key: 'rise', label: '밑위' },
  { key: 'thigh', label: '허벅지' },
  { key: 'hem', label: '밑단' },
]

export function getVisibleSizeGuideColumns(
  rows: ProductSizeGuideRow[],
): Array<{ key: keyof ProductSizeGuideRow; label: string }> {
  return SIZE_GUIDE_COLUMNS.filter((column) =>
    rows.some((row) => row[column.key].trim().length > 0),
  )
}
