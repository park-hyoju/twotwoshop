import {
  PRODUCT_IMAGE_BUCKET,
  buildProductImagePath,
  getProductImagePublicUrl,
  getProductImageUploadEndpoint,
  getSupabaseAnonKey,
} from './productImageStorage'

export const PRODUCT_VIDEO_MAX_BYTES = 500 * 1024 * 1024
export const PRODUCT_VIDEO_MAX_MB = PRODUCT_VIDEO_MAX_BYTES / (1024 * 1024)

/** iOS 사진 보관함에서 사진·영상이 함께 보이도록 wildcard만 사용 (capture 없음). */
export const DETAIL_MEDIA_ACCEPT = 'image/*,video/*'

/** A: 업로드 + 웹 재생 우선 지원 */
const UPLOADABLE_VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/m4v',
])

const UPLOADABLE_VIDEO_EXTENSION_PATTERN = /\.(mp4|m4v|mov|webm)$/i

/** B/C: 인식은 하지만 변환 없이 업로드하면 고객 화면 재생 실패 가능 → 거부 */
const UNSUPPORTED_VIDEO_MIME_TYPES = new Set([
  'video/mpeg',
  'video/mp2t',
  'video/3gpp',
  'video/3gpp2',
  'video/x-matroska',
  'video/avi',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/x-flv',
  'video/ogg',
  'application/ogg',
])

const UNSUPPORTED_VIDEO_EXTENSION_PATTERN =
  /\.(mpeg|mpg|mpe|ts|mts|m2ts|3gp|3gpp|3g2|mkv|avi|wmv|flv|ogv|ogg|vob|mxf)$/i

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp)$/i
const DETAIL_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

function getExtension(fileName: string): string {
  const match = /\.([^.]+)$/.exec(fileName.trim())
  return match ? match[1].toLowerCase() : ''
}

function isBlankOrGenericMime(mime: string): boolean {
  return mime === '' || mime === 'application/octet-stream'
}

export function isUploadableVideoFile(file: File): boolean {
  if (UPLOADABLE_VIDEO_MIME_TYPES.has(file.type)) {
    return true
  }

  if (isBlankOrGenericMime(file.type) && UPLOADABLE_VIDEO_EXTENSION_PATTERN.test(file.name)) {
    return true
  }

  // MIME이 비표준이어도 확장자가 우선 지원 대상이면 허용 (모바일 카메라)
  if (UPLOADABLE_VIDEO_EXTENSION_PATTERN.test(file.name) && file.type.startsWith('video/')) {
    return true
  }

  return false
}

/** @deprecated use isUploadableVideoFile — 동일 의미 유지 */
export function isAcceptedVideoFile(file: File): boolean {
  return isUploadableVideoFile(file)
}

export function isRecognizedUnsupportedVideoFile(file: File): boolean {
  if (isUploadableVideoFile(file)) {
    return false
  }

  if (UNSUPPORTED_VIDEO_MIME_TYPES.has(file.type)) {
    return true
  }

  if (UNSUPPORTED_VIDEO_EXTENSION_PATTERN.test(file.name)) {
    return true
  }

  return false
}

export function isLikelyVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) {
    return true
  }

  if (isBlankOrGenericMime(file.type) && /\.(mp4|m4v|mov|webm|mpeg|mpg|3gp|mkv|avi|wmv|flv|ogv|ts|mts|m2ts)$/i.test(file.name)) {
    return true
  }

  return isUploadableVideoFile(file) || isRecognizedUnsupportedVideoFile(file)
}

export function isAcceptedDetailImageFile(file: File): boolean {
  if (file.type.startsWith('image/heic') || file.type.startsWith('image/heif') || /\.(heic|heif)$/i.test(file.name)) {
    return false
  }

  if (DETAIL_IMAGE_MIME_TYPES.has(file.type)) {
    return true
  }

  if (file.type.startsWith('image/') && IMAGE_EXTENSION_PATTERN.test(file.name)) {
    return true
  }

  if (isBlankOrGenericMime(file.type) && IMAGE_EXTENSION_PATTERN.test(file.name)) {
    return true
  }

  return false
}

export function isAcceptedDetailMediaFile(file: File): boolean {
  return isUploadableVideoFile(file) || isAcceptedDetailImageFile(file)
}

export function filterAcceptedDetailMediaFiles(files: File[]): File[] {
  return files.filter(isAcceptedDetailMediaFile)
}

export function getDetailMediaRejectMessage(files: File[]): string {
  if (files.some(isRecognizedUnsupportedVideoFile)) {
    return '이 영상 형식은 브라우저 재생 호환성이 없어 업로드할 수 없습니다. MP4, MOV, M4V, WEBM을 사용해 주세요.'
  }

  if (files.some((file) => /\.(heic|heif)$/i.test(file.name) || file.type.includes('heic') || file.type.includes('heif'))) {
    return '아이폰 HEIC/HEIF 사진은 JPG로 변환 후 업로드해 주세요.'
  }

  if (files.some(isLikelyVideoFile)) {
    return '지원되지 않는 영상 형식입니다. MP4, MOV, M4V, WEBM만 업로드할 수 있습니다.'
  }

  return 'JPG, PNG, WEBP 이미지 또는 MP4, MOV, M4V, WEBM 영상만 업로드할 수 있습니다.'
}

export function validateProductVideoFile(file: File): void {
  if (isRecognizedUnsupportedVideoFile(file)) {
    throw new Error(
      '이 영상 형식은 브라우저 재생 호환성이 없어 업로드할 수 없습니다. MP4, MOV, M4V, WEBM을 사용해 주세요.',
    )
  }

  if (!isUploadableVideoFile(file)) {
    throw new Error('지원되지 않는 영상 형식입니다. MP4, MOV, M4V, WEBM만 업로드할 수 있습니다.')
  }

  if (file.size > PRODUCT_VIDEO_MAX_BYTES) {
    throw new Error(`영상 파일은 최대 ${PRODUCT_VIDEO_MAX_MB}MB까지 업로드할 수 있습니다.`)
  }
}

function looksLikeMp4Family(header: Uint8Array): boolean {
  return (
    header.length >= 8 &&
    header[4] === 0x66 &&
    header[5] === 0x74 &&
    header[6] === 0x79 &&
    header[7] === 0x70
  )
}

function looksLikeWebm(header: Uint8Array): boolean {
  return (
    header.length >= 4 &&
    header[0] === 0x1a &&
    header[1] === 0x45 &&
    header[2] === 0xdf &&
    header[3] === 0xa3
  )
}

/** 확장자 위장 파일 완화: MP4 계열(ftyp) / WEBM 시그니처 확인 */
export async function assertVideoFileSignature(file: File): Promise<void> {
  if (file.size < 12) {
    throw new Error('영상 파일이 너무 작거나 손상된 것 같습니다.')
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const extension = getExtension(file.name)

  if (extension === 'webm') {
    if (!looksLikeWebm(header)) {
      throw new Error('영상 파일 내용이 WEBM 형식과 일치하지 않습니다.')
    }
    return
  }

  // mp4 / mov / m4v / 빈 확장자지만 MIME이 업로드 가능인 경우
  if (!looksLikeMp4Family(header)) {
    throw new Error('영상 파일 내용이 MP4/MOV 형식과 일치하지 않습니다.')
  }
}

/** Storage 업로드용 Content-Type. 빈/octet-stream은 확장자로 보정합니다. */
export function resolveProductVideoContentType(file: File): string {
  if (file.type && UPLOADABLE_VIDEO_MIME_TYPES.has(file.type)) {
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
  if (lowerName.endsWith('.mp4')) {
    return 'video/mp4'
  }

  if (file.type.startsWith('video/')) {
    return file.type
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
