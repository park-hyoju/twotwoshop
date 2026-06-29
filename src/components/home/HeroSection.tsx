import { Section } from '../common/Section'
import { HeroBannerCarousel } from './HeroBannerCarousel'
import type { StorefrontBanner } from '../../types/banner'

interface HeroSectionProps {
  banners: StorefrontBanner[]
  isLoading?: boolean
}

export function HeroSection({ banners, isLoading = false }: HeroSectionProps) {
  return (
    <Section ariaLabel="메인 배너" className="bg-white lg:py-20">
      {isLoading ? (
        <div className="flex aspect-[4/3] items-center justify-center rounded-[20px] border border-[#eee] bg-[#f5f5f5] text-sm text-[#999]">
          배너를 불러오는 중...
        </div>
      ) : (
        <HeroBannerCarousel banners={banners} />
      )}
    </Section>
  )
}
