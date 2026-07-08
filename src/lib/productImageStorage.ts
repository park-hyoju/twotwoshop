export const PRODUCT_IMAGE_BUCKET = 'product-images'

export const PRODUCT_IMAGE_MAX_ORIGINAL_BYTES = 20 * 1024 * 1024

/** 10MB 이상이면 운영자에게 경고 (업로드는 압축 후 시도). */
export const PRODUCT_IMAGE_WARN_BYTES = 10 * 1024 * 1024

export const PRODUCT_IMAGE_ACCEPT =
  'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

export const PRODUCT_IMAGE_UPLOAD_HINT =
  'JPG, PNG, WEBP · 10MB 이상 자동 압축 · 원본 최대 20MB'

export const PRODUCT_IMAGE_HEIC_MESSAGE =
  '아이폰 HEIC 사진은 JPG로 변환 후 업로드해 주세요.'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

const ALLOWED_EXTENSION_PATTERN = /\.(jpe?g|png|webp)$/i

const HEIC_EXTENSION_PATTERN = /\.(heic|heif)$/i

const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif'])

function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('VITE_SUPABASE_URL is not configured')
  }

  return url.replace(/\/$/, '')
}

function sanitizeFileName(fileName: string): string {
  const extension = fileName.includes('.') ? fileName.split('.').pop() ?? 'jpg' : 'jpg'
  const baseName = fileName.replace(/\.[^.]+$/, '')
  const safeBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  return `${safeBase || 'image'}.${extension.toLowerCase()}`
}

export function isHeicImageFile(file: File): boolean {
  if (HEIC_MIME_TYPES.has(file.type)) {
    return true
  }

  return HEIC_EXTENSION_PATTERN.test(file.name)
}

export function isAcceptedImageFile(file: File): boolean {
  if (isHeicImageFile(file)) {
    return false
  }

  if (ALLOWED_MIME_TYPES.has(file.type)) {
    return true
  }

  if (file.type === '' && ALLOWED_EXTENSION_PATTERN.test(file.name)) {
    return true
  }

  return false
}

export function filterAcceptedImageFiles(files: File[]): File[] {
  return files.filter(isAcceptedImageFile)
}

export function buildProductImagePath(
  productId: string,
  role: 'thumbnail' | 'detail',
  fileName: string,
): string {
  const safeName = sanitizeFileName(fileName)
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return `products/${productId}/${role}-${uniqueSuffix}-${safeName}`
}

export function getProductImagePublicUrl(path: string): string {
  const supabaseUrl = getSupabaseUrl()
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${encodedPath}`
}

export function isProductImageStorageUrl(url: string): boolean {
  if (!url.trim()) {
    return false
  }

  try {
    return extractProductImageStoragePath(url) !== null
  } catch {
    return false
  }
}

export function extractProductImageStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) {
    return null
  }

  const rawPath = url.slice(index + marker.length)
  return decodeURIComponent(rawPath)
}

export function validateProductImageFile(file: File): void {
  if (isHeicImageFile(file)) {
    throw new Error(PRODUCT_IMAGE_HEIC_MESSAGE)
  }

  if (!isAcceptedImageFile(file)) {
    throw new Error('JPG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.')
  }

  if (file.size > PRODUCT_IMAGE_MAX_ORIGINAL_BYTES) {
    throw new Error('원본 이미지 크기는 20MB 이하여야 합니다.')
  }
}

export function getProductImageUploadEndpoint(path: string): string {
  const supabaseUrl = getSupabaseUrl()
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${supabaseUrl}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}/${encodedPath}`
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (typeof key !== 'string' || key.length === 0) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not configured')
  }

  return key
}

export function isPlaceholderProductImage(url: string): boolean {
  return url.startsWith('/images/placeholder/')
}
