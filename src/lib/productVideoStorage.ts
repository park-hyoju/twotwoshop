import {
  PRODUCT_IMAGE_BUCKET,
  buildProductImagePath,
  getProductImagePublicUrl,
  getProductImageUploadEndpoint,
  getSupabaseAnonKey,
} from './productImageStorage'

export const PRODUCT_VIDEO_MAX_BYTES = 500 * 1024 * 1024

export const DETAIL_MEDIA_ACCEPT = 'image/*,video/*'

/** Common mobile/browser video MIME types (iPhone / Galaxy / Android / desktop). */
const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/m4v',
  'video/x-matroska',
  'video/avi',
  'video/x-msvideo',
  'video/3gpp',
  'video/3gpp2',
])

const VIDEO_EXTENSION_PATTERN = /\.(mp4|m4v|mov|webm|mkv|avi|3gp|3gpp)$/i
const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp)$/i

export function isAcceptedVideoFile(file: File): boolean {
  if (VIDEO_MIME_TYPES.has(file.type)) {
    return true
  }

  // 기기/브라우저가 MIME을 비우거나 다르게 보내도 확장자로 허용 (모바일 촬영본)
  if (VIDEO_EXTENSION_PATTERN.test(file.name)) {
    return true
  }

  return false
}

export function isAcceptedDetailMediaFile(file: File): boolean {
  if (isAcceptedVideoFile(file)) {
    return true
  }

  if (file.type.startsWith('image/')) {
    return IMAGE_EXTENSION_PATTERN.test(file.name) || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  }

  if (file.type === '' && IMAGE_EXTENSION_PATTERN.test(file.name)) {
    return true
  }

  return false
}

export function filterAcceptedDetailMediaFiles(files: File[]): File[] {
  return files.filter(isAcceptedDetailMediaFile)
}

export function validateProductVideoFile(file: File): void {
  if (!isAcceptedVideoFile(file)) {
    throw new Error('MP4, MOV, M4V, WEBM, MKV, AVI, 3GP 형식의 영상만 업로드할 수 있습니다.')
  }

  if (file.size > PRODUCT_VIDEO_MAX_BYTES) {
    throw new Error('영상 용량은 500MB 이하여야 합니다.')
  }
}

/** Storage 업로드용 Content-Type. 빈/비표준 file.type은 확장자로 video MIME을 지정합니다. */
export function resolveProductVideoContentType(file: File): string {
  if (file.type && VIDEO_MIME_TYPES.has(file.type)) {
    return file.type
  }

  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith('.webm')) {
    return 'video/webm'
  }
  if (lowerName.endsWith('.mov')) {
    return 'video/quicktime'
  }
  if (lowerName.endsWith('.m4v')) {
    return 'video/x-m4v'
  }
  if (lowerName.endsWith('.mkv')) {
    return 'video/x-matroska'
  }
  if (lowerName.endsWith('.avi')) {
    return 'video/x-msvideo'
  }
  if (lowerName.endsWith('.3gp') || lowerName.endsWith('.3gpp')) {
    return 'video/3gpp'
  }
  if (lowerName.endsWith('.mp4')) {
    return 'video/mp4'
  }

  return 'video/mp4'
}

export function buildProductVideoPath(productId: string, fileName: string): string {
  return buildProductImagePath(productId, 'detail', fileName).replace('/detail-', '/detail-video-')
}

export function getProductVideoUploadEndpoint(path: string): string {
  return getProductImageUploadEndpoint(path)
}

export function getProductVideoPublicUrl(path: string): string {
  return getProductImagePublicUrl(path)
}

export { PRODUCT_IMAGE_BUCKET, getSupabaseAnonKey }
