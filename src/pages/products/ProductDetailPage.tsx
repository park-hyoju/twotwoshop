import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { ProductDetailView } from '../../components/product/ProductDetailView'
import { ProductLoadingMessage } from '../../components/product/ProductLoadingMessage'
import { useProductBySlug } from '../../hooks/useProductBySlug'
import { addRecentProduct } from '../../lib/recentProducts'
import { ROUTES } from '../../lib/routes'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { product, isLoading, notFound } = useProductBySlug(slug)

  useEffect(() => {
    if (!product) {
      return
    }

    addRecentProduct({
      slug: product.slug,
      name: product.name,
      thumbnail: product.thumbnail,
      price: product.price,
    })
  }, [product])

  if (!slug) {
    return <Navigate to={ROUTES.notFound} replace />
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ProductLoadingMessage />
      </div>
    )
  }

  if (notFound || !product) {
    return <Navigate to={ROUTES.notFound} replace />
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          to={ROUTES.products}
          className="text-base text-neutral-600 transition-colors hover:text-neutral-900 sm:text-lg"
        >
          ← 상품 목록으로
        </Link>
      </div>
      <ProductDetailView product={product} />
    </div>
  )
}
