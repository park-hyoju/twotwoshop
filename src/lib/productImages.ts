import { parseProductIntroPayload } from './productIntroContent'
import { isPlaceholderProductImage } from './productImageStorage'

export function placeholderImageForSlug(slug: string): string {
  return `/images/placeholder/${slug}.jpg`
}

/** PDP hero carousel: thumbnail + gallery images only (excludes detail images). */
export function buildProductGalleryImages(
  thumbnail: string,
  images: string[],
  shortDescription = '',
): string[] {
  const payload = parseProductIntroPayload(shortDescription)
  const galleryExtras = payload ? images.slice(0, payload.galleryCount) : images
  const result: string[] = []
  const seen = new Set<string>()

  for (const url of [thumbnail, ...galleryExtras]) {
    const trimmed = url.trim()
    if (!trimmed || seen.has(trimmed)) {
      continue
    }

    if (isPlaceholderProductImage(trimmed) && result.length > 0) {
      continue
    }

    seen.add(trimmed)
    result.push(trimmed)
  }

  if (result.length > 0) {
    return result
  }

  const fallback = thumbnail.trim()
  return fallback ? [fallback] : []
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
