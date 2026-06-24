import { isPlaceholderProductImage } from './productImageStorage'

export const PRODUCT_INTRO_PREFIX = '__TWOTWOSHOP_INTRO_v2__:'
export const LEGACY_INTRO_PREFIX = '__TWOTWOSHOP_DETAIL_v1__:'

export interface ProductIntroPayloadV2 {
  galleryCount: number
  detailImages: string[]
}

export interface LegacyIntroBlock {
  id: string
  imageUrl: string
  text: string
}

export interface LegacyIntroData {
  galleryCount: number
  items: LegacyIntroBlock[]
}

export function isValidIntroImageUrl(url: string): boolean {
  return Boolean(url.trim()) && !isPlaceholderProductImage(url)
}

export function isProductIntroPayload(shortDescription: string): boolean {
  return (
    shortDescription.startsWith(PRODUCT_INTRO_PREFIX) ||
    shortDescription.startsWith(LEGACY_INTRO_PREFIX)
  )
}

export function isRawJsonDescription(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return false
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown
    return typeof parsed === 'object' && parsed !== null
  } catch {
    return false
  }
}

export function parseProductIntroPayload(shortDescription: string): ProductIntroPayloadV2 | null {
  if (shortDescription.startsWith(PRODUCT_INTRO_PREFIX)) {
    try {
      const parsed = JSON.parse(
        shortDescription.slice(PRODUCT_INTRO_PREFIX.length),
      ) as ProductIntroPayloadV2

      if (!parsed || !Array.isArray(parsed.detailImages)) {
        return null
      }

      return {
        galleryCount: typeof parsed.galleryCount === 'number' ? parsed.galleryCount : 0,
        detailImages: parsed.detailImages.filter(isValidIntroImageUrl),
      }
    } catch {
      return null
    }
  }

  if (shortDescription.startsWith(LEGACY_INTRO_PREFIX)) {
    try {
      const legacy = JSON.parse(
        shortDescription.slice(LEGACY_INTRO_PREFIX.length),
      ) as LegacyIntroData

      if (!legacy || !Array.isArray(legacy.items)) {
        return null
      }

      return {
        galleryCount: typeof legacy.galleryCount === 'number' ? legacy.galleryCount : 0,
        detailImages: legacy.items
          .map((item) => item.imageUrl.trim())
          .filter(isValidIntroImageUrl),
      }
    } catch {
      return null
    }
  }

  return null
}

export function serializeProductIntroPayload(data: ProductIntroPayloadV2): string {
  return `${PRODUCT_INTRO_PREFIX}${JSON.stringify(data)}`
}

export function getDetailImageUrls(shortDescription: string, images: string[]): string[] {
  const payload = parseProductIntroPayload(shortDescription)
  if (payload) {
    return payload.detailImages
  }

  return images.filter(isValidIntroImageUrl)
}

export function getLegacyDescriptionText(shortDescription: string, description: string): string {
  if (isProductIntroPayload(shortDescription)) {
    return ''
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

/** @deprecated use getDetailImageUrls */
export function getRenderableIntroBlocks(shortDescription: string): LegacyIntroBlock[] {
  const urls = getDetailImageUrls(shortDescription, [])
  return urls.map((imageUrl, index) => ({
    id: `legacy-${index}`,
    imageUrl,
    text: '',
  }))
}
