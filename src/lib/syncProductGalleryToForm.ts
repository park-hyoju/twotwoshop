import type { ProductGalleryImage } from '../components/admin/products/ProductImageGalleryManager'
import {
  hasDoneGalleryImage,
  isGalleryImageBusy,
  isGalleryImageDone,
} from '../components/admin/products/ProductImageGalleryManager'
import type { AdminProductDetailForm } from '../types/adminProductDetail'
import {
  collectGalleryPhotos,
  syncGalleryToForm,
} from '../components/admin/products/detail/detailContent/detailContent'

export function getGalleryImageUrls(images: ProductGalleryImage[]): string[] {
  return images
    .filter(isGalleryImageDone)
    .map((image) => image.remoteUrl ?? image.previewUrl)
    .filter((url) => url.length > 0)
}

export function hasBusyGalleryImage(images: ProductGalleryImage[]): boolean {
  return images.some(isGalleryImageBusy)
}

export function galleryImagesDifferFromForm(
  galleryImages: ProductGalleryImage[],
  form: AdminProductDetailForm,
): boolean {
  const nextUrls = getGalleryImageUrls(galleryImages)
  const currentUrls = collectGalleryPhotos(form)
  return JSON.stringify(nextUrls) !== JSON.stringify(currentUrls)
}

export function syncGalleryImagesToForm(
  galleryImages: ProductGalleryImage[],
  _form: AdminProductDetailForm,
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void,
): boolean {
  if (!hasDoneGalleryImage(galleryImages)) {
    return false
  }

  const galleryUrls = getGalleryImageUrls(galleryImages)
  syncGalleryToForm(galleryUrls, _form, onChange)
  return true
}
