import { describe, expect, it } from 'vitest'
import { resolveBannerImages, withImageCacheBust } from './bannerImageResolver'

describe('bannerImageResolver', () => {
  it('resolves desktop image with priority order', () => {
    expect(
      resolveBannerImages({
        image_url: 'https://example.com/fallback.jpg',
        desktop_image_url: 'https://example.com/desktop.jpg',
      }).desktopImage,
    ).toBe('https://example.com/desktop.jpg')
  })

  it('falls back mobile image to desktop image', () => {
    expect(
      resolveBannerImages({
        desktop_image: 'https://example.com/desktop.jpg',
      }).mobileImage,
    ).toBe('https://example.com/desktop.jpg')
  })

  it('appends cache bust query param', () => {
    expect(withImageCacheBust('https://example.com/a.jpg', '2026-01-01')).toBe(
      'https://example.com/a.jpg?v=2026-01-01',
    )
  })
})
