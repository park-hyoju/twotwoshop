export const PRODUCT_DESC_PREFIX = '__TWOTWOSHOP_DESC_v1__:'

export type ProductDescriptionFontSize = 'small' | 'normal' | 'large'
export type ProductDescriptionFontWeight = 'normal' | 'bold'
export type ProductDescriptionAlign = 'left' | 'center' | 'right'

export interface ProductDescriptionFormat {
  text: string
  fontSize: ProductDescriptionFontSize
  fontWeight: ProductDescriptionFontWeight
  align: ProductDescriptionAlign
}

export const DEFAULT_PRODUCT_DESCRIPTION: ProductDescriptionFormat = {
  text: '',
  fontSize: 'normal',
  fontWeight: 'normal',
  align: 'left',
}

function isFontSize(value: unknown): value is ProductDescriptionFontSize {
  return value === 'small' || value === 'normal' || value === 'large'
}

function isFontWeight(value: unknown): value is ProductDescriptionFontWeight {
  return value === 'normal' || value === 'bold'
}

function isAlign(value: unknown): value is ProductDescriptionAlign {
  return value === 'left' || value === 'center' || value === 'right'
}

export function isFormattedProductDescription(value: string): boolean {
  return value.startsWith(PRODUCT_DESC_PREFIX)
}

export function parseProductDescription(raw: string): ProductDescriptionFormat {
  if (!isFormattedProductDescription(raw)) {
    return {
      ...DEFAULT_PRODUCT_DESCRIPTION,
      text: raw,
    }
  }

  try {
    const parsed = JSON.parse(raw.slice(PRODUCT_DESC_PREFIX.length)) as Partial<ProductDescriptionFormat>

    return {
      text: typeof parsed.text === 'string' ? parsed.text : '',
      fontSize: isFontSize(parsed.fontSize) ? parsed.fontSize : 'normal',
      fontWeight: isFontWeight(parsed.fontWeight) ? parsed.fontWeight : 'normal',
      align: isAlign(parsed.align) ? parsed.align : 'left',
    }
  } catch {
    return { ...DEFAULT_PRODUCT_DESCRIPTION }
  }
}

export function serializeProductDescription(format: ProductDescriptionFormat): string {
  if (!format.text.trim()) {
    return ''
  }

  return `${PRODUCT_DESC_PREFIX}${JSON.stringify({
    text: format.text,
    fontSize: format.fontSize,
    fontWeight: format.fontWeight,
    align: format.align,
  })}`
}

export function getProductDescriptionPlainText(raw: string): string {
  return parseProductDescription(raw).text.trim()
}

export const DESCRIPTION_FONT_SIZE_CLASS: Record<ProductDescriptionFontSize, string> = {
  small: 'text-sm leading-6 sm:text-base sm:leading-7',
  normal: 'text-base leading-7 sm:text-lg sm:leading-8',
  large: 'text-lg leading-8 sm:text-xl sm:leading-9',
}

export const DESCRIPTION_FONT_WEIGHT_CLASS: Record<ProductDescriptionFontWeight, string> = {
  normal: 'font-normal',
  bold: 'font-bold',
}

export const DESCRIPTION_ALIGN_CLASS: Record<ProductDescriptionAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}
