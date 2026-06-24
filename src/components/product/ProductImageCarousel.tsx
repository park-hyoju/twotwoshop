import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { buildProductGalleryImages } from '../../lib/productImages'
import type { Product } from '../../types/product'
import { ProductImage } from './ProductImage'

interface ProductImageCarouselProps {
  product: Product
  isSoldOut?: boolean
}

const SWIPE_THRESHOLD_PX = 48

export function ProductImageCarousel({ product, isSoldOut = false }: ProductImageCarouselProps) {
  const images = useMemo(
    () => buildProductGalleryImages(product.thumbnail, product.images, product.shortDescription),
    [product.thumbnail, product.images, product.shortDescription],
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)

  const total = images.length
  const hasMultiple = total > 1

  useEffect(() => {
    setCurrentIndex(0)
  }, [product.slug, images])

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) {
        return
      }

      const nextIndex = (index + total) % total
      setCurrentIndex(nextIndex)
    },
    [total],
  )

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo])
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo])

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
    return null
  }

  return (
    <div
      className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full"
      aria-roledescription="carousel"
      aria-label={`${product.name} 상품 이미지`}
    >
      <div className="relative overflow-hidden rounded-none bg-neutral-100 sm:rounded-2xl">
        <div
          className="aspect-square touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {images.map((image, index) => (
              <div key={`${image}-${index}`} className="h-full w-full shrink-0">
                <ProductImage
                  src={image}
                  alt={`${product.name} 상품 이미지 ${index + 1}`}
                  slug={product.slug}
                  className={`h-full w-full object-cover ${isSoldOut ? 'opacity-70' : ''}`}
                />
              </div>
            ))}
          </div>
        </div>

        {isSoldOut && (
          <span className="absolute left-4 top-4 rounded-lg bg-neutral-800 px-3 py-1.5 text-base font-semibold text-white">
            품절
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md transition hover:bg-white md:flex"
              aria-label="이전 이미지"
            >
              <span aria-hidden className="text-xl leading-none">
                ‹
              </span>
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md transition hover:bg-white md:flex"
              aria-label="다음 이미지"
            >
              <span aria-hidden className="text-xl leading-none">
                ›
              </span>
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
              {images.map((image, index) => (
                <button
                  key={`dot-${image}-${index}`}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`rounded-full transition-all ${
                    index === currentIndex
                      ? 'h-2 w-2 bg-neutral-900'
                      : 'h-2 w-2 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  aria-label={`${index + 1}번째 이미지 보기`}
                  aria-current={index === currentIndex}
                />
              ))}
            </div>

            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
              {currentIndex + 1} / {total}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
