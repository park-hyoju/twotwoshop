import { useEffect, useState } from 'react'
import { productRepository } from '../services/productRepository'
import type { Product } from '../types/product'

export function useProductBySlug(slug: string | undefined) {
  const [product, setProduct] = useState<Product | undefined>()
  const [isLoading, setIsLoading] = useState(Boolean(slug))
  const [isResolved, setIsResolved] = useState(false)

  useEffect(() => {
    if (!slug) {
      setProduct(undefined)
      setIsLoading(false)
      setIsResolved(true)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setIsResolved(false)

    void productRepository.findProductBySlug(slug).then((result) => {
      if (!cancelled) {
        setProduct(result)
        setIsLoading(false)
        setIsResolved(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [slug])

  return {
    product,
    isLoading,
    notFound: isResolved && !product,
  }
}
