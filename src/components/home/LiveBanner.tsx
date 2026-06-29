import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import type { LiveBanner as LiveBannerData } from '../../types/banner'

interface LiveBannerProps {
  banner: LiveBannerData
}

export function LiveBanner({ banner }: LiveBannerProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-[20px] border border-neutral-800 bg-neutral-900 px-6 py-12 text-center sm:px-10 sm:py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-4 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <Radio size={14} strokeWidth={1.8} className="text-neutral-300" aria-hidden="true" />
        <span className="text-xs font-semibold tracking-[0.16em] text-neutral-200">
          {banner.badge}
        </span>
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {banner.title}
      </h2>
      <Link
        to={banner.ctaHref}
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white px-8 text-sm font-semibold tracking-wide text-neutral-900 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        {banner.ctaLabel}
      </Link>
    </div>
  )
}
