import { Link, Navigate, useParams } from 'react-router-dom'
import { ProductDetailView } from '../../components/product/ProductDetailView'
import { ROUTES } from '../../lib/routes'
import { getProductBySlug } from '../../services/productService'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  if (!slug) {
    return <Navigate to={ROUTES.notFound} replace />
  }

  const product = getProductBySlug(slug)

  if (!product) {
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
