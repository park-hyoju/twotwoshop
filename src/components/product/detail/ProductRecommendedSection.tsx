import { useEffect, useState } from 'react'
import { isProductPurchasable } from '../../../lib/productStock'
import { productRepository } from '../../../services/productRepository'
import type { Product } from '../../../types/product'
import { ProductGrid } from '../ProductGrid'
import { ProductLoadingMessage } from '../ProductLoadingMessage'

interface ProductRecommendedSectionProps {
  product: Product
}

const MAX_RECOMMENDATIONS = 8

export function ProductRecommendedSection({ product }: ProductRecommendedSectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadRecommendations() {
      setIsLoading(true)

      try {
        const relatedProducts = await productRepository.findRelatedProducts(product.id)
        const curated = relatedProducts
          .filter((item) => item.id !== product.id && isProductPurchasable(item))
          .slice(0, MAX_RECOMMENDATIONS)

        if (cancelled) {
          return
        }

        if (curated.length > 0) {
          setProducts(curated)
          setIsLoading(false)
          return
        }

        const categoryProducts = await productRepository.findProductsByProductCategory(
          product.productCategory,
        )

        if (cancelled) {
          return
        }

        const recommendations = categoryProducts
          .filter((item) => item.id !== product.id && isProductPurchasable(item))
          .slice(0, MAX_RECOMMENDATIONS)

        setProducts(recommendations)
        setIsLoading(false)
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
  }, [product.id, product.productCategory])

  if (!isLoading && products.length === 0) {
    return null
  }

  return (
    <section className="border-t border-neutral-200 pt-12 sm:pt-16">
      <div className="mb-8 sm:mb-10">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          이런 상품은 어떠세요?
        </h2>
        <p className="mt-2 text-sm text-neutral-500 sm:text-base">
          함께 보면 좋은 상품을 모아봤어요.
        </p>
      </div>

      {isLoading ? <ProductLoadingMessage /> : <ProductGrid products={products} />}
    </section>
  )
}
