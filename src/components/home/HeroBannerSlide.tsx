import { Link } from 'react-router-dom'
import { HERO_BANNER_HEIGHT_CLASS } from '../../lib/bannerConstants'
import type { HeroSlide } from '../../types/heroBanner'

interface HeroBannerSlideProps {
  slide: HeroSlide
}

const NO_IMAGE_BACKGROUND_CLASS =
  'bg-[linear-gradient(135deg,#f3eee7_0%,#d8cec2_100%)]'

function HeroBannerCta({ slide }: HeroBannerSlideProps) {
  const className =
    'mt-6 inline-flex items-center justify-center rounded-full bg-[#111111] px-8 py-3 text-base font-semibold text-white transition-all duration-[250ms] ease-in-out hover:-translate-y-0.5 hover:bg-[#222222] md:mt-8 md:px-10 md:py-4'

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

      <div className="relative flex h-full flex-col justify-end px-6 pb-20 md:justify-center md:px-12 md:pb-0 lg:px-16">
        <div className="max-w-[280px] md:max-w-[600px]">
          <p
            className={`text-sm font-semibold uppercase tracking-[0.25em] md:text-xs md:tracking-[0.28em] ${
              hasImage ? 'text-white/85' : 'text-neutral-600'
            }`}
          >
            {slide.eyebrow}
          </p>
          <h2
            className={`mt-3 line-clamp-4 whitespace-pre-line text-3xl font-bold leading-tight md:mt-4 md:line-clamp-none md:text-4xl md:font-semibold lg:text-[2.75rem] ${
              hasImage ? 'text-white' : 'text-neutral-900'
            }`}
          >
            {slide.headline}
          </h2>
          {slide.description.trim().length > 0 && (
            <p
              className={`mt-4 line-clamp-3 max-w-[280px] whitespace-pre-line text-sm leading-relaxed md:mt-5 md:line-clamp-none md:max-w-[520px] md:text-base lg:text-lg ${
                hasImage ? 'text-white/90' : 'text-neutral-700'
              }`}
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
