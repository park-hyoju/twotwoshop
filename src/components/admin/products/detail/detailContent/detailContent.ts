import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import {
  isValidIntroImageUrl,
  parseProductIntroPayload,
  serializeProductIntroPayload,
  type ProductIntroPayloadV2,
} from '../../../../../lib/productIntroContent'

function isValidImageUrl(url: string): boolean {
  return isValidIntroImageUrl(url)
}

export function collectGalleryPhotos(form: AdminProductDetailForm): string[] {
  const payload = parseProductIntroPayload(form.short_description)
  const photos: string[] = []
  const thumbnail = form.thumbnail?.trim()

  if (thumbnail && isValidImageUrl(thumbnail)) {
    photos.push(thumbnail)
  }

  const galleryImages = payload
    ? form.images.slice(0, payload.galleryCount).filter(isValidImageUrl)
    : form.images.filter(isValidImageUrl)

  for (const image of galleryImages) {
    if (!photos.includes(image)) {
      photos.push(image)
    }
  }

  return photos
}

export function getDetailImagesFromForm(form: AdminProductDetailForm): string[] {
  const payload = parseProductIntroPayload(form.short_description)
  if (payload) {
    return payload.detailImages
  }

  const galleryPhotos = collectGalleryPhotos(form)
  const gallerySet = new Set(galleryPhotos)
  return form.images.filter((url) => isValidImageUrl(url) && !gallerySet.has(url))
}

export function hasDetailImages(form: AdminProductDetailForm): boolean {
  return getDetailImagesFromForm(form).length > 0
}

export function syncProductImagesToForm(
  galleryPhotos: string[],
  detailImages: string[],
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void,
) {
  const galleryUrls = galleryPhotos.filter(isValidImageUrl)
  const detailUrls = detailImages.filter(isValidImageUrl)
  const galleryCount = Math.max(0, galleryUrls.length - 1)
  const mergedImages = [...galleryUrls.slice(1), ...detailUrls]

  const payload: ProductIntroPayloadV2 = {
    galleryCount,
    detailImages: detailUrls,
  }

  onChange('thumbnail', galleryUrls[0] ?? '')
  onChange('images', mergedImages)
  onChange('description', '')
  onChange('short_description', serializeProductIntroPayload(payload))
}
