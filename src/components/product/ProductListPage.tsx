import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductSearchField, saveRecentSearch } from '../search'
import {
  buildSearchCorrectionMessage,
  normalizeKeyword,
  searchProducts,
} from '../../lib/search'
import type { Product } from '../../types/product'
import { ProductGrid } from './ProductGrid'
import { ProductLoadingMessage } from './ProductLoadingMessage'
import { ProductSearchEmptyState } from './ProductSearchEmptyState'

interface ProductListPageProps {
  title: string
  description: string
  products: Product[]
  isLoading?: boolean
  emptyMessage?: string
  showSearchField?: boolean
}

export function ProductListPage({
  title,
  description,
  products,
  isLoading = false,
  emptyMessage = '표시할 상품이 없습니다.',
  showSearchField = false,
}: ProductListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = normalizeKeyword(searchParams.get('search') ?? '')
  const [draftQuery, setDraftQuery] = useState(searchQuery)
  const searchResult = useMemo(
    () => searchProducts(products, searchQuery),
    [products, searchQuery],
  )
  const isSearchActive = searchQuery.length > 0
  const displayTitle = isSearchActive ? `'${searchQuery}' 검색 결과` : title
  const displayDescription = isSearchActive
    ? '원하시는 상품을 확인해보세요.'
    : description

  useEffect(() => {
    setDraftQuery(searchQuery)
  }, [searchQuery])

  function updateSearchParam(query: string) {
    const normalized = normalizeKeyword(query)
    const nextParams = new URLSearchParams(searchParams)

    if (normalized) {
      nextParams.set('search', normalized)
    } else {
      nextParams.delete('search')
    }

    setSearchParams(nextParams)
  }

  function handleSearchSubmit(query: string) {
    const normalized = normalizeKeyword(query)
    if (normalized) {
      saveRecentSearch(normalized)
    }
    updateSearchParam(query)
  }

  function handleDebouncedSearch(query: string) {
    if (!showSearchField) {
      return
    }

    updateSearchParam(query)
  }

  const resultCountLabel = isSearchActive
    ? `검색 결과 ${searchResult.products.length}개`
    : `총 ${products.length}개 상품`

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {showSearchField && (
        <div className="mb-10 max-w-xl">
          <ProductSearchField
            value={draftQuery}
            onChange={setDraftQuery}
            onSubmit={handleSearchSubmit}
            onDebouncedSearch={handleDebouncedSearch}
            showSubmitButton
          />
        </div>
      )}

      <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">{displayTitle}</h1>
      <p className="mt-4 text-lg text-[#6B7280] sm:text-xl">{displayDescription}</p>

      {searchResult.wasCorrected && searchResult.correctedQuery && (
        <p className="mt-3 text-base text-neutral-700 sm:text-lg">
          {buildSearchCorrectionMessage(searchResult.correctedQuery)}
        </p>
      )}

      {!isLoading && (
        <p className="mt-2 text-base text-neutral-500">{resultCountLabel}</p>
      )}

      <div className="mt-10">
        {isLoading ? (
          <ProductLoadingMessage />
        ) : searchResult.products.length > 0 ? (
          <ProductGrid products={searchResult.products} centered />
        ) : isSearchActive ? (
          <ProductSearchEmptyState />
        ) : (
          <p className="rounded-xl bg-neutral-100 px-6 py-10 text-center text-base text-neutral-600 sm:text-lg">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  )
}
