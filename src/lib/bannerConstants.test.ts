import { describe, expect, it } from 'vitest'
import {
  BANNER_ASPECT_CLASS,
  BANNER_IMAGE_SIZE_GUIDE,
  formatBannerImageSizeGuide,
  HERO_AUTO_PLAY_MS,
  HERO_BANNER_HEIGHT_CLASS,
} from './bannerConstants'

describe('bannerConstants', () => {
  it('exposes recommended image sizes', () => {
    expect(BANNER_IMAGE_SIZE_GUIDE.desktop).toEqual({ width: 1920, height: 700, label: 'PC' })
    expect(BANNER_IMAGE_SIZE_GUIDE.mobile).toEqual({ width: 750, height: 1000, label: 'Mobile' })
  })

  it('formats size guide labels', () => {
    expect(formatBannerImageSizeGuide('desktop')).toBe('PC 권장: 1920 × 700px')
    expect(formatBannerImageSizeGuide('mobile')).toBe('Mobile 권장: 750 × 1000px')
  })

  it('uses admin preview aspect ratio classes', () => {
    expect(BANNER_ASPECT_CLASS).toContain('aspect-[750/1000]')
    expect(BANNER_ASPECT_CLASS).toContain('lg:aspect-[1920/700]')
  })

  it('uses fixed storefront hero heights', () => {
    expect(HERO_BANNER_HEIGHT_CLASS).toContain('h-[420px]')
    expect(HERO_BANNER_HEIGHT_CLASS).toContain('md:h-[520px]')
    expect(HERO_BANNER_HEIGHT_CLASS).toContain('lg:h-[650px]')
  })

  it('autoplays hero carousel every 5 seconds', () => {
    expect(HERO_AUTO_PLAY_MS).toBe(5000)
  })
})
