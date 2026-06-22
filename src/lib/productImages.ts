import { isPlaceholderProductImage } from './productImageStorage'

export function placeholderImageForSlug(slug: string): string {
  return `/images/placeholder/${slug}.jpg`
}

export function resolveProductThumbnail(
  thumbnail: string | null | undefined,
  slug: string,
): string {
  const value = thumbnail?.trim()
  if (value) {
    return value
  }

  return placeholderImageForSlug(slug)
}

export function resolveProductImages(
  images: string[] | null | undefined,
  thumbnail: string | null | undefined,
  slug: string,
): string[] {
  const resolvedThumbnail = resolveProductThumbnail(thumbnail, slug)
  const normalized = (images ?? []).map((url) => url.trim()).filter(Boolean)
  const realImages = normalized.filter((url) => !isPlaceholderProductImage(url))

  if (realImages.length > 0) {
    return realImages
  }

  if (!isPlaceholderProductImage(resolvedThumbnail)) {
    return [resolvedThumbnail]
  }

  if (normalized.length > 0) {
    return normalized
  }

  return [resolvedThumbnail]
}

export function getProductImageFallback(slug: string, currentSrc: string): string {
  const fallback = placeholderImageForSlug(slug)
  return currentSrc === fallback ? currentSrc : fallback
}
