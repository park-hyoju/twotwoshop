import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Product } from '../types/product'

export function useAsyncProducts(
  fetchProducts: () => Promise<Product[]>,
  cacheKey: string,
) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    let cancelled = false
    setIsLoading(isSupabaseConfigured)

    void fetchProducts().then((data) => {
      if (!cancelled) {
        setProducts(data)
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
    // fetchProducts is stable per cacheKey at call sites
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  return { products, isLoading }
}
