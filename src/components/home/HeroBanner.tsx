import { useEffect } from 'react'
import { HERO_BANNER_HEIGHT_CLASS } from '../../lib/bannerConstants'
import { logHeroBannerDebug, resolveHeroSlides } from '../../lib/heroBanner'
import type { StorefrontBanner } from '../../types/banner'
import { HeroBannerCarousel } from './HeroBannerCarousel'

interface HeroBannerProps {
  banners: StorefrontBanner[]
  isLoading?: boolean
}

export function HeroBanner({ banners, isLoading = false }: HeroBannerProps) {
  const slides = resolveHeroSlides(banners)

  useEffect(() => {
    logHeroBannerDebug(banners, slides)
  }, [banners, slides])

  return (
    <section aria-label="메인 배너" className="w-full">
      {isLoading ? (
        <div
          className={`flex items-center justify-center bg-[linear-gradient(135deg,#f3eee7_0%,#d8cec2_100%)] text-sm text-neutral-600 ${HERO_BANNER_HEIGHT_CLASS}`}
        >
          배너를 불러오는 중...
        </div>
      ) : (
        <HeroBannerCarousel slides={slides} />
      )}
    </section>
  )
}
