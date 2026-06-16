import { Section } from '../common/Section'
import { HeroBanner } from './HeroBanner'
import type { HeroBanner as HeroBannerData } from '../../types/banner'

interface HeroSectionProps {
  banner: HeroBannerData
}

export function HeroSection({ banner }: HeroSectionProps) {
  return (
    <Section ariaLabel="메인 배너" className="bg-neutral-100 lg:py-24">
      <HeroBanner banner={banner} />
    </Section>
  )
}
