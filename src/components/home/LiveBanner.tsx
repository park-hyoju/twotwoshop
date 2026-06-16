import { Link } from 'react-router-dom'
import type { LiveBanner as LiveBannerData } from '../../types/banner'

interface LiveBannerProps {
  banner: LiveBannerData
}

export function LiveBanner({ banner }: LiveBannerProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-700 bg-neutral-800 px-6 py-12 text-center sm:px-10 sm:py-16">
      <p className="text-lg font-semibold text-red-400 sm:text-xl">{banner.badge}</p>
      <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{banner.title}</h2>
      <Link
        to={banner.ctaHref}
        className="mt-8 inline-flex min-h-14 items-center justify-center rounded-xl bg-white px-8 text-lg font-semibold text-neutral-900 transition-colors hover:bg-neutral-200"
      >
        {banner.ctaLabel}
      </Link>
    </div>
  )
}
