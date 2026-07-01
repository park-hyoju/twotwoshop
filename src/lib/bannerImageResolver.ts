type ImageSource = Record<string, unknown>

function pickUrl(source: ImageSource, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

const DESKTOP_KEYS = [
  'desktop_image',
  'desktopImage',
  'desktop_image_url',
  'desktopImageUrl',
  'pc_image',
  'pcImage',
  'pc_image_url',
  'pcImageUrl',
  'image_url',
  'imageUrl',
] as const

const MOBILE_KEYS = [
  'mobile_image',
  'mobileImage',
  'mobile_image_url',
  'mobileImageUrl',
] as const

export interface ResolvedBannerImages {
  desktopImage: string | null
  mobileImage: string | null
}

export function resolveBannerImages(source: ImageSource): ResolvedBannerImages {
  const desktopImage = pickUrl(source, [...DESKTOP_KEYS])
  const mobileImage =
    pickUrl(source, [...MOBILE_KEYS]) ??
    desktopImage ??
    pickUrl(source, ['pc_image_url', 'pcImageUrl', 'image_url', 'imageUrl'])

  return {
    desktopImage,
    mobileImage: mobileImage ?? desktopImage,
  }
}

export function withImageCacheBust(url: string | null, version: string | null): string | null {
  if (!url) {
    return null
  }

  if (!version) {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${encodeURIComponent(version)}`
}
