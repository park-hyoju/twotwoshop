import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import type { StorefrontBanner } from '../../types/banner'
import { HeroBannerPlaceholder, HeroBannerSlide } from './HeroBannerSlide'

interface HeroBannerCarouselProps {
  banners: StorefrontBanner[]
}

const SWIPE_THRESHOLD_PX = 48
const AUTO_PLAY_MS = 6000

export function HeroBannerCarousel({ banners }: HeroBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)
  const total = banners.length
  const hasMultiple = total > 1

  useEffect(() => {
    setCurrentIndex(0)
  }, [banners])

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) {
        return
      }

      setCurrentIndex((index + total) % total)
    },
    [total],
  )

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo])
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo])

  useEffect(() => {
    if (!hasMultiple || isPaused) {
      return
    }

    const timer = window.setInterval(() => {
      goNext()
    }, AUTO_PLAY_MS)

    return () => window.clearInterval(timer)
  }, [currentIndex, goNext, hasMultiple, isPaused])

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null
    touchDeltaX.current = 0
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) {
      return
    }

    const currentX = event.touches[0]?.clientX ?? touchStartX.current
    touchDeltaX.current = currentX - touchStartX.current
  }

  function handleTouchEnd() {
    if (touchStartX.current === null) {
      return
    }

    if (touchDeltaX.current <= -SWIPE_THRESHOLD_PX) {
      goNext()
    } else if (touchDeltaX.current >= SWIPE_THRESHOLD_PX) {
      goPrev()
    }

    touchStartX.current = null
    touchDeltaX.current = 0
  }

  if (total === 0) {
    return <HeroBannerPlaceholder />
  }

  if (total === 1) {
    return <HeroBannerSlide banner={banners[0]!} />
  }

  return (
    <div
      className="relative"
      aria-roledescription="carousel"
      aria-label="메인 배너"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div key={banner.id} className="w-full shrink-0">
              <HeroBannerSlide banner={banner} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={goPrev}
        className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-800 shadow-sm transition hover:bg-white lg:flex"
        aria-label="이전 배너"
      >
        <span aria-hidden className="text-xl leading-none">
          ‹
        </span>
      </button>

      <button
        type="button"
        onClick={goNext}
        className="absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-800 shadow-sm transition hover:bg-white lg:flex"
        aria-label="다음 배너"
      >
        <span aria-hidden className="text-xl leading-none">
          ›
        </span>
      </button>

      <div className="mt-8 flex items-center justify-center gap-2">
        {banners.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => goTo(index)}
            className={`rounded-full transition-all ${
              index === currentIndex
                ? 'h-2.5 w-6 bg-neutral-900'
                : 'h-2.5 w-2.5 bg-neutral-300 hover:bg-neutral-400'
            }`}
            aria-label={`${index + 1}번째 배너 보기`}
            aria-current={index === currentIndex}
          />
        ))}
      </div>
    </div>
  )
}
