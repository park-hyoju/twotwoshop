import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { HERO_AUTO_PLAY_MS } from '../../lib/bannerConstants'
import type { HeroSlide } from '../../types/heroBanner'
import { HeroBannerSlide } from './HeroBannerSlide'

interface HeroBannerCarouselProps {
  slides: HeroSlide[]
}

const SWIPE_THRESHOLD_PX = 48

export function HeroBannerCarousel({ slides }: HeroBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)
  const total = slides.length
  const hasMultiple = total > 1

  useEffect(() => {
    setCurrentIndex(0)
  }, [slides])

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
    }, HERO_AUTO_PLAY_MS)

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

  return (
    <div
      className="relative w-full"
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
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="relative w-full shrink-0">
              <HeroBannerSlide slide={slide} />
            </div>
          ))}
        </div>
      </div>

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 text-2xl leading-none text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-black/35 md:flex lg:left-8"
            aria-label="이전 배너"
          >
            <span aria-hidden>‹</span>
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 text-2xl leading-none text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-black/35 md:flex lg:right-8"
            aria-label="다음 배너"
          >
            <span aria-hidden>›</span>
          </button>

          <div className="absolute bottom-5 left-0 right-0 z-10 flex items-center justify-center gap-2.5 md:bottom-6">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'h-2 w-8 bg-white'
                    : 'h-2 w-2 bg-white/45 hover:bg-white/75'
                }`}
                aria-label={`${index + 1}번째 배너 보기`}
                aria-current={index === currentIndex}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
