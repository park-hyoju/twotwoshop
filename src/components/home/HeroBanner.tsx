import { Link } from 'react-router-dom'
import type { HeroBanner as HeroBannerData } from '../../types/banner'

interface HeroBannerProps {
  banner: HeroBannerData
}

export function HeroBanner({ banner }: HeroBannerProps) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="text-center lg:text-left">
        <p className="text-base font-medium text-neutral-600 sm:text-lg" translate="no">
          {banner.brandName}
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl lg:text-5xl">
          {banner.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600 sm:text-xl">
          {banner.description}
        </p>
        <Link
          to={banner.ctaHref}
          className="mt-8 inline-flex min-h-14 items-center justify-center rounded-xl bg-neutral-900 px-8 text-lg font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          {banner.ctaLabel}
        </Link>
      </div>

      <div
        className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-neutral-300 text-lg text-neutral-600 sm:text-xl"
        aria-label={banner.imageAlt}
      >
        배너 이미지
      </div>
    </div>
  )
}
