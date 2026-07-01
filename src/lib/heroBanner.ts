import {
  DEFAULT_HERO_BUTTON_LINK,
  DEFAULT_HERO_BUTTON_TEXT,
  DEFAULT_HERO_DESCRIPTION,
  DEFAULT_HERO_EYEBROW,
  DEFAULT_HERO_HEADLINE,
  DEFAULT_HERO_SLIDES,
} from '../data/heroBannerSlides'
import type { StorefrontBanner } from '../types/banner'
import type { HeroSlide } from '../types/heroBanner'

export function mapStorefrontBannerToHeroSlide(banner: StorefrontBanner): HeroSlide {
  return {
    id: banner.id,
    eyebrow: banner.eyebrow?.trim() || DEFAULT_HERO_EYEBROW,
    headline: banner.headline?.trim() || DEFAULT_HERO_HEADLINE,
    description: banner.description?.trim() || DEFAULT_HERO_DESCRIPTION,
    buttonText: banner.buttonText?.trim() || DEFAULT_HERO_BUTTON_TEXT,
    buttonLink: banner.buttonLink?.trim() || DEFAULT_HERO_BUTTON_LINK,
    desktopImage: banner.desktopImage,
    mobileImage: banner.mobileImage,
  }
}

export function resolveHeroSlides(banners: StorefrontBanner[]): HeroSlide[] {
  if (banners.length === 0) {
    return DEFAULT_HERO_SLIDES
  }

  return banners.map(mapStorefrontBannerToHeroSlide)
}

export function logHeroBannerDebug(banners: StorefrontBanner[], slides: HeroSlide[]): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.log('[hero-banner] loaded banner count:', banners.length)

  slides.forEach((slide, index) => {
    console.log(`[hero-banner] slide ${index + 1}`, {
      id: slide.id,
      desktopImageUrl: slide.desktopImage,
      mobileImageUrl: slide.mobileImage,
      renderDesktopUrl: slide.desktopImage ?? slide.mobileImage,
      renderMobileUrl: slide.mobileImage ?? slide.desktopImage,
    })
  })
}
