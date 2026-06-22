import { useEffect, useState } from 'react'
import { getProductImageFallback } from '../../lib/productImages'

interface ProductImageProps {
  src: string
  alt: string
  slug: string
  className?: string
}

export function ProductImage({ src, alt, slug, className = '' }: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(src)

  useEffect(() => {
    setImageSrc(src)
  }, [src])

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        setImageSrc((current) => getProductImageFallback(slug, current))
      }}
    />
  )
}
