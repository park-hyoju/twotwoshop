import { Link } from 'react-router-dom'
import { HERO_BANNER_HEIGHT_CLASS } from '../../lib/bannerConstants'
import type { HeroSlide } from '../../types/heroBanner'

interface HeroBannerSlideProps {
  slide: HeroSlide
}

const NO_IMAGE_BACKGROUND_CLASS =
  'bg-[linear-gradient(135deg,#f3eee7_0%,#d8cec2_100%)]'

/** Mobile (<768px) — base classes only, no responsive text-* that could leak */
const MOBILE_WRAPPER =
  'absolute inset-0 z-10 flex flex-col justify-end px-6 pb-12'

const MOBILE_EYEBROW = 'text-[12px] font-semibold uppercase tracking-[0.26em]'

const MOBILE_HEADLINE =
  'mt-3 max-w-[300px] whitespace-pre-line text-[30px] font-bold leading-[1.1]'

const MOBILE_DESCRIPTION =
  'mt-4 max-w-[300px] whitespace-pre-line text-[15px] leading-[1.45]'

const MOBILE_BUTTON =
  'mt-5 inline-flex items-center justify-center rounded-full bg-[#111111] px-7 py-3 text-[15px] font-semibold text-white transition-all duration-[250ms] ease-in-out hover:-translate-y-0.5 hover:bg-[#222222]'

/** Desktop (md+) — applied only from md breakpoint */
const DESKTOP_WRAPPER =
  'md:static md:z-auto md:flex md:h-full md:justify-center md:px-12 md:pb-0 lg:px-16'

const DESKTOP_INNER = 'md:max-w-[600px]'

const DESKTOP_EYEBROW = 'md:text-xs md:tracking-[0.28em]'

const DESKTOP_HEADLINE =
  'md:mt-4 md:max-w-[600px] md:text-4xl md:font-semibold md:leading-tight lg:text-[2.75rem]'

const DESKTOP_DESCRIPTION =
  'md:mt-5 md:max-w-[520px] md:text-base md:leading-relaxed lg:text-lg'

const DESKTOP_BUTTON = 'md:mt-8 md:px-10 md:py-4 md:text-base'

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

function HeroBannerCta({ slide }: HeroBannerSlideProps) {
  const className = `${MOBILE_BUTTON} ${DESKTOP_BUTTON}`

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
  const colors = hasImage ? TEXT_COLOR.onImage : TEXT_COLOR.onFallback

  return (
    <div
      className={`relative w-full overflow-hidden ${HERO_BANNER_HEIGHT_CLASS}`}
      data-hero-slide
    >
      {hasImage ? (
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
      ) : (
        <div className={`absolute inset-0 ${NO_IMAGE_BACKGROUND_CLASS}`} aria-hidden="true" />
      )}

      {hasImage ? (
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
      ) : null}

      <div className={`${MOBILE_WRAPPER} ${DESKTOP_WRAPPER}`} data-hero-text-wrapper>
        <div className={`w-full ${DESKTOP_INNER}`}>
          <p className={`${MOBILE_EYEBROW} ${DESKTOP_EYEBROW} ${colors.eyebrow}`}>{slide.eyebrow}</p>
          <h2 className={`${MOBILE_HEADLINE} ${DESKTOP_HEADLINE} ${colors.headline}`}>
            {slide.headline}
          </h2>
          {slide.description.trim().length > 0 && (
            <p className={`${MOBILE_DESCRIPTION} ${DESKTOP_DESCRIPTION} ${colors.description}`}>
              {slide.description}
            </p>
          )}
          <HeroBannerCta slide={slide} />
        </div>
      </div>
    </div>
  )
}
