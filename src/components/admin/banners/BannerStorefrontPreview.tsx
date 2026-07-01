import { HeroBannerSlide } from '../../home/HeroBannerSlide'
import { mapStorefrontBannerToHeroSlide } from '../../../lib/heroBanner'
import type { AdminBannerFormInput } from '../../../types/banner'

interface BannerStorefrontPreviewProps {
  form: AdminBannerFormInput
}

export function BannerStorefrontPreview({ form }: BannerStorefrontPreviewProps) {
  const slide = mapStorefrontBannerToHeroSlide({
    id: 'preview',
    eyebrow: form.eyebrow,
    headline: form.headline,
    description: form.description,
    buttonText: form.button_text,
    buttonLink: form.button_link,
    desktopImage: form.desktop_image.trim() || null,
    mobileImage: form.mobile_image.trim() || null,
    updatedAt: null,
  })

  return (
    <div className="overflow-hidden border border-neutral-200 bg-white">
      <p className="border-b border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 sm:px-6">
        스토어프론트 미리보기
      </p>
      <HeroBannerSlide slide={slide} />
    </div>
  )
}
