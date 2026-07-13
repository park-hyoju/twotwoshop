import { useEffect, useState } from 'react'

interface ProductImageProps {
  src: string
  alt: string
  slug: string
  className?: string
}

export function ProductImage({ src, alt, slug: _slug, className = '' }: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setImageSrc(src)
    setHasError(false)
  }, [src])

  if (!imageSrc.trim() || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 text-sm text-neutral-500 ${className}`}
        role="img"
        aria-label={alt}
      >
        이미지 준비 중
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        setHasError(true)
      }}
    />
  )
}
