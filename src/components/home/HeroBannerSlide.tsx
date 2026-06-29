import { Link } from 'react-router-dom'
import type { StorefrontBanner } from '../../types/banner'

const BRAND_NAME = 'TWOTWOSHOP'

interface HeroBannerSlideProps {
  banner: Pick<
    StorefrontBanner,
    'title' | 'description' | 'buttonText' | 'buttonLink' | 'desktopImage' | 'mobileImage'
  >
}

function BannerImage({ banner }: HeroBannerSlideProps) {
  const desktopSrc = banner.desktopImage ?? banner.mobileImage
  const mobileSrc = banner.mobileImage ?? banner.desktopImage

  if (!desktopSrc && !mobileSrc) {
    return (
      <div
        className="flex aspect-[4/3] items-center justify-center rounded-[20px] border border-[#eee] bg-[#f5f5f5] text-sm tracking-wide text-[#999]"
        aria-hidden="true"
      >
        BANNER IMAGE
      </div>
    )
  }

  return (
    <div className="aspect-[4/3] overflow-hidden rounded-[20px] border border-[#eee] bg-[#f5f5f5]">
      <picture>
        {mobileSrc && <source media="(max-width: 1023px)" srcSet={mobileSrc} />}
        <img
          src={desktopSrc ?? mobileSrc ?? ''}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </picture>
    </div>
  )
}

function BannerCta({ banner }: HeroBannerSlideProps) {
  const className =
    'mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#111] px-8 text-sm font-semibold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-[#333] hover:shadow-lg'

  if (banner.buttonText.trim().length === 0) {
    return null
  }

  if (banner.buttonLink.startsWith('/')) {
    return (
      <Link to={banner.buttonLink} className={className}>
        {banner.buttonText}
      </Link>
    )
  }

  return (
    <a href={banner.buttonLink} className={className}>
      {banner.buttonText}
    </a>
  )
}

export function HeroBannerSlide({ banner }: HeroBannerSlideProps) {
  return (
    <div className="grid min-w-full shrink-0 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="text-center lg:text-left">
        <p
          className="text-xs font-semibold tracking-[0.2em] text-[#888] sm:text-sm"
          translate="no"
        >
          {BRAND_NAME}
        </p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[#111] sm:text-4xl lg:text-[2.75rem]">
          {banner.title}
        </h2>
        {banner.description.trim().length > 0 && (
          <p className="mt-5 text-base leading-relaxed text-[#666] sm:text-lg">
            {banner.description}
          </p>
        )}
        <BannerCta banner={banner} />
      </div>

      <BannerImage banner={banner} />
    </div>
  )
}

export function HeroBannerPlaceholder() {
  return (
    <HeroBannerSlide
      banner={{
        title: '메인 배너',
        description: '',
        buttonText: '',
        buttonLink: '/products',
        desktopImage: null,
        mobileImage: null,
      }}
    />
  )
}
