import type { Product } from '../../types/product'
import { ProductGrid } from './ProductGrid'

interface ProductListPageProps {
  title: string
  description: string
  products: Product[]
}

export function ProductListPage({ title, description, products }: ProductListPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">{title}</h1>
      <p className="mt-4 text-lg text-neutral-600 sm:text-xl">{description}</p>
      <p className="mt-2 text-base text-neutral-500">총 {products.length}개 상품</p>

      <div className="mt-10">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="rounded-xl bg-neutral-100 px-6 py-10 text-center text-base text-neutral-600 sm:text-lg">
            표시할 상품이 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
