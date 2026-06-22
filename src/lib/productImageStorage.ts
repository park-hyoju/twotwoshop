export const PRODUCT_IMAGE_BUCKET = 'product-images'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|gif|webp|heic|heif)$/i

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

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

export function isAcceptedImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) {
    return true
  }

  if (file.type === '' && IMAGE_EXTENSION_PATTERN.test(file.name)) {
    return true
  }

  return ALLOWED_MIME_TYPES.has(file.type)
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
  if (!isAcceptedImageFile(file)) {
    throw new Error('JPG, PNG, WEBP, GIF 형식의 이미지만 업로드할 수 있습니다.')
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('이미지 크기는 10MB 이하여야 합니다.')
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
