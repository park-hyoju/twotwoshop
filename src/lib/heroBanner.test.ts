import { describe, expect, it } from 'vitest'
import { DEFAULT_HERO_SLIDES } from '../data/heroBannerSlides'
import { mapStorefrontBannerToHeroSlide, resolveHeroSlides } from './heroBanner'

describe('heroBanner', () => {
  it('returns default slides only when no admin banners exist', () => {
    expect(resolveHeroSlides([])).toEqual(DEFAULT_HERO_SLIDES)
    expect(resolveHeroSlides([])).toHaveLength(3)
  })

  it('uses admin banners when available', () => {
    const slides = resolveHeroSlides([
      {
        id: 'banner-1',
        eyebrow: 'SUMMER SALE',
        headline: '여름 세일',
        description: '최대 50% 할인',
        buttonText: '보러가기',
        buttonLink: '/products/sale',
        desktopImage: 'https://example.com/desktop.jpg',
        mobileImage: 'https://example.com/mobile.jpg',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    expect(slides).toHaveLength(1)
    expect(slides[0]).toMatchObject({
      id: 'banner-1',
      eyebrow: 'SUMMER SALE',
      headline: '여름 세일',
      buttonText: '보러가기',
      desktopImage: 'https://example.com/desktop.jpg',
    })
  })

  it('fills default copy when admin fields are empty', () => {
    const slide = mapStorefrontBannerToHeroSlide({
      id: 'banner-2',
      eyebrow: null,
      headline: null,
      description: null,
      buttonText: null,
      buttonLink: null,
      desktopImage: null,
      mobileImage: null,
      updatedAt: null,
    })

    expect(slide.eyebrow).toBe('TWOTWOSHOP')
    expect(slide.headline).toContain('TWOTWOSHOP')
    expect(slide.buttonText).toBe('지금 쇼핑하기')
    expect(slide.buttonLink).toBe('/products')
  })
})
