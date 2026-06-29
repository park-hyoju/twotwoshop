import { HeroBannerSlide } from '../../home/HeroBannerSlide'
import type { AdminBannerFormInput } from '../../../types/banner'

interface BannerStorefrontPreviewProps {
  form: AdminBannerFormInput
}

export function BannerStorefrontPreview({ form }: BannerStorefrontPreviewProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6">
      <p className="mb-4 text-sm font-semibold text-neutral-700">스토어프론트 미리보기</p>
      <HeroBannerSlide
        banner={{
          title: form.title.trim() || '배너 제목',
          description: form.description,
          buttonText: form.button_text.trim() || '버튼',
          buttonLink: form.button_link.trim() || '/products',
          desktopImage: form.desktop_image.trim() || null,
          mobileImage: form.mobile_image.trim() || null,
        }}
      />
    </div>
  )
}
