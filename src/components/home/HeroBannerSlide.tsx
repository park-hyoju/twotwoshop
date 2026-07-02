import { Link } from 'react-router-dom'
import { HERO_BANNER_HEIGHT_CLASS } from '../../lib/bannerConstants'
import type { HeroSlide } from '../../types/heroBanner'

interface HeroBannerSlideProps {
  slide: HeroSlide
}

const NO_IMAGE_BACKGROUND_CLASS =
  'bg-[linear-gradient(135deg,#f3eee7_0%,#d8cec2_100%)]'

const TEXT_COLOR = {
  onImage: {
    eyebrow: 'text-white/85',
    headline: 'text-white',
    description: 'text-white/90',
  },
  onFallback: {
    eyebrow: 'text-neutral-600',
    headline: 'text-neutral-900',
    description: 'text-neutral-700',
  },
} as const

const MOBILE_BUTTON =
  'mt-5 inline-flex items-center justify-center rounded-full bg-[#111111] px-7 py-3 text-[15px] font-semibold text-white transition-all duration-[250ms] ease-in-out hover:bg-[#222222]'

const DESKTOP_BUTTON =
  'mt-8 inline-flex items-center justify-center rounded-full bg-[#111111] px-10 py-4 text-[18px] font-semibold text-white transition-all duration-[250ms] ease-in-out hover:-translate-y-0.5 hover:bg-[#222222]'

function HeroBannerCta({ slide, variant }: HeroBannerSlideProps & { variant: 'mobile' | 'desktop' }) {
  const className = variant === 'mobile' ? MOBILE_BUTTON : DESKTOP_BUTTON

  if (slide.buttonText.trim().length === 0) {
    return null
  }

  if (slide.buttonLink.startsWith('/')) {
    return (
      <Link to={slide.buttonLink} className={className}>
        {slide.buttonText}
      </Link>
    )
  }

  return (
    <a href={slide.buttonLink} className={className}>
      {slide.buttonText}
    </a>
  )
}

function HeroBannerImage({
  desktopSrc,
  mobileSrc,
  hasImage,
}: {
  desktopSrc: string | null
  mobileSrc: string | null
  hasImage: boolean
}) {
  if (!hasImage) {
    return <div className={`absolute inset-0 ${NO_IMAGE_BACKGROUND_CLASS}`} aria-hidden="true" />
  }

  return (
    <picture className="absolute inset-0">
      {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
      <img
        src={desktopSrc ?? mobileSrc ?? ''}
        alt=""
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    </picture>
  )
}

function HeroBannerOverlay({ hasImage }: { hasImage: boolean }) {
  if (!hasImage) {
    return null
  }

  return (
    <>
      <div
        className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.25)_100%)] md:hidden"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-[1] hidden bg-[rgba(0,0,0,0.25)] md:block"
        aria-hidden="true"
      />
    </>
  )
}

export function HeroBannerSlide({ slide }: HeroBannerSlideProps) {
  const desktopSrc = slide.desktopImage ?? slide.mobileImage
  const mobileSrc = slide.mobileImage ?? slide.desktopImage
  const hasImage = Boolean(desktopSrc || mobileSrc)
  const colors = hasImage ? TEXT_COLOR.onImage : TEXT_COLOR.onFallback

  return (
    <div
      className={`relative w-full overflow-hidden ${HERO_BANNER_HEIGHT_CLASS}`}
      data-hero-slide
    >
      <HeroBannerImage desktopSrc={desktopSrc} mobileSrc={mobileSrc} hasImage={hasImage} />
      <HeroBannerOverlay hasImage={hasImage} />

      {/* Mobile (<768px) */}
      <div
        className="absolute inset-0 z-10 flex flex-col justify-center px-6 md:hidden"
        data-hero-text-wrapper="mobile"
      >
        <div className="max-w-[280px] -translate-y-4">
          <p className={`text-[12px] font-semibold uppercase tracking-[0.26em] ${colors.eyebrow}`}>
            {slide.eyebrow}
          </p>
          <h2
            className={`mt-2 max-w-[300px] whitespace-pre-line text-[28px] font-bold leading-[1.15] ${colors.headline}`}
          >
            {slide.headline}
          </h2>
          {slide.description.trim().length > 0 && (
            <p
              className={`mt-3 max-w-[300px] whitespace-pre-line text-[15px] leading-[1.45] ${colors.description}`}
            >
              {slide.description}
            </p>
          )}
          <HeroBannerCta slide={slide} variant="mobile" />
        </div>
      </div>

      {/* Desktop (md+) */}
      <div
        className="relative z-10 hidden h-full md:flex md:items-center md:px-12 lg:px-16"
        data-hero-text-wrapper="desktop"
      >
        <div className="max-w-[600px]">
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${colors.eyebrow}`}>
            {slide.eyebrow}
          </p>
          <h2
            className={`mt-4 max-w-[600px] whitespace-pre-line text-[56px] font-semibold leading-tight ${colors.headline}`}
          >
            {slide.headline}
          </h2>
          {slide.description.trim().length > 0 && (
            <p
              className={`mt-5 max-w-[520px] whitespace-pre-line text-[22px] leading-relaxed ${colors.description}`}
            >
              {slide.description}
            </p>
          )}
          <HeroBannerCta slide={slide} variant="desktop" />
        </div>
      </div>
    </div>
  )
}
