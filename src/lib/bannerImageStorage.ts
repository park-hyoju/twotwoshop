export const BANNER_IMAGE_BUCKET = 'banner-images'

export const BANNER_IMAGE_ACCEPT =
  'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

export const BANNER_IMAGE_UPLOAD_HINT =
  'JPG, PNG, WEBP · 원본 최대 20MB · 업로드 시 자동 최적화'

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

export function buildBannerImagePath(
  bannerId: string,
  role: 'desktop' | 'mobile',
  fileName: string,
): string {
  const safeName = sanitizeFileName(fileName)
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return `banners/${bannerId}/${role}-${uniqueSuffix}-${safeName}`
}

export function getBannerImagePublicUrl(path: string): string {
  const supabaseUrl = getSupabaseUrl()
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${supabaseUrl}/storage/v1/object/public/${BANNER_IMAGE_BUCKET}/${encodedPath}`
}

export function extractBannerImageStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BANNER_IMAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) {
    return null
  }

  const rawPath = url.slice(index + marker.length)
  return decodeURIComponent(rawPath)
}

export function getBannerImageUploadEndpoint(path: string): string {
  const supabaseUrl = getSupabaseUrl()
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${supabaseUrl}/storage/v1/object/${BANNER_IMAGE_BUCKET}/${encodedPath}`
}

export function getSupabaseAnonKeyForBannerUpload(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (typeof key !== 'string' || key.length === 0) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not configured')
  }

  return key
}
