import { useEffect, useState } from 'react'
import { loadProductRecommendations } from '../../../lib/productRecommendations'
import type { Product } from '../../../types/product'
import { ProductGrid } from '../ProductGrid'
import { ProductLoadingMessage } from '../ProductLoadingMessage'

interface ProductRecommendedSectionProps {
  product: Product
}

export function ProductRecommendedSection({ product }: ProductRecommendedSectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadRecommendations() {
      setIsLoading(true)

      try {
        const recommendations = await loadProductRecommendations(product)

        if (!cancelled) {
          setProducts(recommendations)
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) {
          setProducts([])
          setIsLoading(false)
        }
      }
    }

    void loadRecommendations()

    return () => {
      cancelled = true
    }
  }, [product])

  if (!isLoading && products.length === 0) {
    return null
  }

  return (
    <section className="mt-10 border-t border-neutral-200 pt-10 sm:mt-12 sm:pt-12">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          연관 추천상품
        </h2>
      </div>

      {isLoading ? <ProductLoadingMessage /> : <ProductGrid products={products} />}
    </section>
  )
}
