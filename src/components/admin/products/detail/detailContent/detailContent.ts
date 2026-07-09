import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { DetailMediaItem } from '../../../../../types/detailMedia'
import { normalizeDetailMediaOrder, reindexDetailMediaByArrayOrder } from '../../../../../lib/detailMedia'
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

/** @deprecated use form.detail_media */
export function getDetailImagesFromForm(form: AdminProductDetailForm): string[] {
  if (form.detail_media.length > 0) {
    return form.detail_media.filter((item) => item.type === 'image').map((item) => item.url)
  }

  const payload = parseProductIntroPayload(form.short_description)
  if (payload) {
    return payload.detailImages
  }

  const galleryPhotos = collectGalleryPhotos(form)
  const gallerySet = new Set(galleryPhotos)
  return form.images.filter((url) => isValidImageUrl(url) && !gallerySet.has(url))
}

export function getDetailMediaFromForm(form: AdminProductDetailForm): DetailMediaItem[] {
  return normalizeDetailMediaOrder(form.detail_media)
}

export function hasDetailImages(form: AdminProductDetailForm): boolean {
  return getDetailMediaFromForm(form).length > 0
}

export function syncGalleryToForm(
  galleryPhotos: string[],
  form: AdminProductDetailForm,
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void,
) {
  const galleryUrls = galleryPhotos.filter(isValidImageUrl)
  const mergedImages = galleryUrls.slice(1)

  onChange('thumbnail', galleryUrls[0] ?? '')
  onChange('images', mergedImages)
  onChange(
    'short_description',
    buildIntroShortDescriptionFromForm({
      ...form,
      thumbnail: galleryUrls[0] ?? '',
      images: mergedImages,
    }),
  )
}

export function syncDetailMediaToForm(
  detailMedia: DetailMediaItem[],
  form: AdminProductDetailForm,
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void,
) {
  const normalized = reindexDetailMediaByArrayOrder(detailMedia)
  onChange('detail_media', normalized)
  onChange(
    'short_description',
    buildIntroShortDescriptionFromForm({
      ...form,
      detail_media: normalized,
    }),
  )
}

export function buildIntroShortDescriptionFromForm(form: AdminProductDetailForm): string {
  const existing = parseProductIntroPayload(form.short_description)
  const galleryCount =
    existing?.galleryCount ?? Math.max(0, collectGalleryPhotos(form).length - 1)
  const detailImages = normalizeDetailMediaOrder(form.detail_media)
    .map((item) => item.url.trim())
    .filter(Boolean)

  return serializeProductIntroPayload({
    galleryCount,
    detailImages,
  })
}

/** @deprecated use syncGalleryToForm + syncDetailMediaToForm */
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
  const mergedImages = [...galleryUrls.slice(1)]

  const payload: ProductIntroPayloadV2 = {
    galleryCount,
    detailImages: [],
  }

  onChange('thumbnail', galleryUrls[0] ?? '')
  onChange('images', mergedImages)
  onChange('short_description', serializeProductIntroPayload(payload))
  onChange(
    'detail_media',
    detailUrls.map((url, index) => ({
      type: 'image' as const,
      url,
      order: index,
      filename: url.split('/').pop() ?? `image-${index + 1}`,
      thumbnail: null,
      duration: null,
      width: null,
      height: null,
    })),
  )
}
