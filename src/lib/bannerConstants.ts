export const BANNER_IMAGE_SIZE_GUIDE = {
  desktop: { width: 1920, height: 700, label: 'PC' },
  mobile: { width: 750, height: 1000, label: 'Mobile' },
} as const

export function formatBannerImageSizeGuide(role: 'desktop' | 'mobile'): string {
  const size = role === 'desktop' ? BANNER_IMAGE_SIZE_GUIDE.desktop : BANNER_IMAGE_SIZE_GUIDE.mobile
  return `${size.label} 권장: ${size.width} × ${size.height}px`
}

export const BANNER_ASPECT_CLASS = 'aspect-[750/1000] lg:aspect-[1920/700]'

/** Storefront hero fixed heights: mobile 420px, tablet 520px, desktop 650px */
export const HERO_BANNER_HEIGHT_CLASS = 'h-[420px] md:h-[520px] lg:h-[650px]'

export const HERO_AUTO_PLAY_MS = 5000
