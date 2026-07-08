import { compressProductImage } from './productImageCompression'
import {
  isAcceptedImageFile,
  isHeicImageFile,
  PRODUCT_IMAGE_HEIC_MESSAGE,
  PRODUCT_IMAGE_MAX_ORIGINAL_BYTES,
  PRODUCT_IMAGE_WARN_BYTES,
} from './productImageStorage'

export interface PrepareProductImageResult {
  file: File
  sizeWarning: boolean
}

export function getProductImageSizeWarning(file: File): boolean {
  return file.size >= PRODUCT_IMAGE_WARN_BYTES
}

export function validateProductImageForGallery(file: File): string | null {
  if (isHeicImageFile(file)) {
    return PRODUCT_IMAGE_HEIC_MESSAGE
  }

  if (!isAcceptedImageFile(file)) {
    return 'JPG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.'
  }

  if (file.size > PRODUCT_IMAGE_MAX_ORIGINAL_BYTES) {
    return '원본 이미지 크기는 20MB 이하여야 합니다.'
  }

  return null
}

/** 검증 → 압축까지 진행하며 progress(0~100) 콜백 호출. */
export async function prepareProductImageFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<PrepareProductImageResult> {
  const validationError = validateProductImageForGallery(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const sizeWarning = getProductImageSizeWarning(file)
  onProgress?.(10)

  onProgress?.(30)
  const compressed = await compressProductImage(file)
  onProgress?.(90)

  onProgress?.(100)

  return { file: compressed, sizeWarning }
}
