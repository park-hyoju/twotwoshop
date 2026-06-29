import { Section } from '../common/Section'
import { LiveBanner } from './LiveBanner'
import type { LiveBanner as LiveBannerData } from '../../types/banner'

interface LiveSectionProps {
  banner: LiveBannerData
}

export function LiveSection({ banner }: LiveSectionProps) {
  return (
    <Section id="live" ariaLabel="라이브방송" className="bg-[#111]">
      <LiveBanner banner={banner} />
    </Section>
  )
}
