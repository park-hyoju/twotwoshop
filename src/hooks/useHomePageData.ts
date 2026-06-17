import { useEffect, useState } from 'react'
import { benefits, categoryShortcuts, heroBanner, liveBanner } from '../data'
import { isSupabaseConfigured } from '../lib/supabase'
import { productRepository } from '../services/productRepository'
import type { Product } from '../types/product'

export function useHomePageData() {
  const [bestProducts, setBestProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(isSupabaseConfigured)

  useEffect(() => {
    let cancelled = false
    setIsLoadingProducts(isSupabaseConfigured)

    void Promise.all([
      productRepository.findBestProducts(),
      productRepository.findNewProducts(),
    ]).then(([best, newest]) => {
      if (!cancelled) {
        setBestProducts(best)
        setNewProducts(newest)
        setIsLoadingProducts(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    heroBanner,
    categoryShortcuts,
    bestProducts,
    newProducts,
    isLoadingProducts,
    liveBanner,
    benefits,
  }
}
