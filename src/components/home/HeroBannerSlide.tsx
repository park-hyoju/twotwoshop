import { Link } from 'react-router-dom'
import { HERO_BANNER_HEIGHT_CLASS } from '../../lib/bannerConstants'
import type { HeroSlide } from '../../types/heroBanner'

interface HeroBannerSlideProps {
  slide: HeroSlide
}

const NO_IMAGE_BACKGROUND_CLASS =
  'bg-[linear-gradient(135deg,#f3eee7_0%,#d8cec2_100%)]'

const MOBILE_TEXT_COLOR = {
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

function HeroBannerCta({ slide }: HeroBannerSlideProps) {
  const className =
    'mt-6 inline-flex items-center justify-center rounded-full bg-[#111111] px-8 py-3 text-[16px] font-semibold text-white transition-all duration-[250ms] ease-in-out hover:-translate-y-0.5 hover:bg-[#222222] md:mt-8 md:px-10 md:py-4 md:text-base'

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

export function HeroBannerSlide({ slide }: HeroBannerSlideProps) {
  const desktopSrc = slide.desktopImage ?? slide.mobileImage
  const mobileSrc = slide.mobileImage ?? slide.desktopImage
  const hasImage = Boolean(desktopSrc || mobileSrc)
  const colors = hasImage ? MOBILE_TEXT_COLOR.onImage : MOBILE_TEXT_COLOR.onFallback

  return (
    <div className={`relative w-full overflow-hidden ${HERO_BANNER_HEIGHT_CLASS}`}>
      {hasImage ? (
        <picture className="absolute inset-0">
          {mobileSrc && <source media="(max-width: 1023px)" srcSet={mobileSrc} />}
          <img
            src={desktopSrc ?? mobileSrc ?? ''}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
      ) : (
        <div className={`absolute inset-0 ${NO_IMAGE_BACKGROUND_CLASS}`} aria-hidden="true" />
      )}

      {hasImage ? (
        <>
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.25)_100%)] md:hidden"
            aria-hidden="true"
          />
          <div className="absolute inset-0 hidden bg-[rgba(0,0,0,0.25)] md:block" aria-hidden="true" />
        </>
      ) : null}

      {/* Mobile (<768px): absolute bottom-aligned. md+: centered PC layout */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-16 md:static md:inset-auto md:flex md:h-full md:justify-center md:px-12 md:pb-0 lg:px-16">
        <div className="w-full md:max-w-[600px]">
          <p
            className={`text-[13px] font-semibold uppercase tracking-[0.28em] md:text-xs ${colors.eyebrow}`}
          >
            {slide.eyebrow}
          </p>
          <h2
            className={`mt-3 max-w-[310px] whitespace-pre-line text-[34px] font-bold leading-[1.12] md:mt-4 md:max-w-[600px] md:text-4xl md:font-semibold md:leading-tight lg:text-[2.75rem] ${colors.headline}`}
          >
            {slide.headline}
          </h2>
          {slide.description.trim().length > 0 && (
            <p
              className={`mt-4 max-w-[300px] whitespace-pre-line text-[16px] leading-[1.5] md:mt-5 md:max-w-[520px] md:text-base md:leading-relaxed lg:text-lg ${colors.description}`}
            >
              {slide.description}
            </p>
          )}
          <HeroBannerCta slide={slide} />
        </div>
      </div>
    </div>
  )
}
