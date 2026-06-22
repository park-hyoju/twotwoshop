import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { filterProductsBySearch, normalizeProductSearchQuery } from '../../lib/productSearch'
import type { Product } from '../../types/product'
import { ProductGrid } from './ProductGrid'
import { ProductLoadingMessage } from './ProductLoadingMessage'
import { ProductSearchEmptyState } from './ProductSearchEmptyState'

interface ProductListPageProps {
  title: string
  description: string
  products: Product[]
  isLoading?: boolean
}

export function ProductListPage({
  title,
  description,
  products,
  isLoading = false,
}: ProductListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = normalizeProductSearchQuery(searchParams.get('search') ?? '')
  const filteredProducts = useMemo(
    () => filterProductsBySearch(products, searchQuery),
    [products, searchQuery],
  )
  const isSearchActive = searchQuery.length > 0
  const displayTitle = isSearchActive ? `'${searchQuery}' 검색 결과` : title
  const displayDescription = isSearchActive
    ? '원하시는 상품을 확인해보세요.'
    : description

  function handleClearSearch() {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('search')
    setSearchParams(nextParams)
  }

  const resultCountLabel = isSearchActive
    ? `검색 결과 ${filteredProducts.length}개`
    : `총 ${filteredProducts.length}개 상품`

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">{displayTitle}</h1>
      <p className="mt-4 text-lg text-neutral-600 sm:text-xl">{displayDescription}</p>
      {!isLoading && (
        <p className="mt-2 text-base text-neutral-500">{resultCountLabel}</p>
      )}

      <div className="mt-10">
        {isLoading ? (
          <ProductLoadingMessage />
        ) : filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} />
        ) : isSearchActive ? (
          <ProductSearchEmptyState query={searchQuery} onRetry={handleClearSearch} />
        ) : (
          <p className="rounded-xl bg-neutral-100 px-6 py-10 text-center text-base text-neutral-600 sm:text-lg">
            표시할 상품이 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
