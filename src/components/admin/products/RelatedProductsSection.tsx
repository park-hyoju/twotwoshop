import { useEffect, useId, useState } from 'react'
import { formatPrice } from '../../../lib/formatPrice'
import {
  searchAdminProductsForRelated,
} from '../../../services/adminProductRelatedRepository'
import {
  MAX_RELATED_PRODUCTS,
  type RelatedProductPick,
} from '../../../types/adminProductRelated'

interface RelatedProductsSectionProps {
  productId: string | null
  selectedProducts: RelatedProductPick[]
  onChange: (products: RelatedProductPick[]) => void
  disabled?: boolean
}

const inputClassName =
  'w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 sm:text-base'

export function RelatedProductsSection({
  productId,
  selectedProducts,
  onChange,
  disabled = false,
}: RelatedProductsSectionProps) {
  const searchInputId = useId()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RelatedProductPick[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const selectedIds = new Set(selectedProducts.map((item) => item.id))
  const isMaxReached = selectedProducts.length >= MAX_RELATED_PRODUCTS

  useEffect(() => {
    if (!isSearchOpen) {
      return
    }

    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setSearchResults([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setSearchError(null)

    const timer = window.setTimeout(() => {
      void searchAdminProductsForRelated(trimmed, productId)
        .then((results) => {
          setSearchResults(results)
          setIsSearching(false)
        })
        .catch(() => {
          setSearchResults([])
          setSearchError('상품 검색 중 오류가 발생했습니다.')
          setIsSearching(false)
        })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [isSearchOpen, productId, searchQuery])

  function handleAddProduct(product: RelatedProductPick) {
    if (selectedIds.has(product.id) || isMaxReached) {
      return
    }

    onChange([...selectedProducts, product])
    setSearchQuery('')
    setSearchResults([])
    setIsSearchOpen(false)
  }

  function handleRemoveProduct(productIdToRemove: string) {
    onChange(selectedProducts.filter((item) => item.id !== productIdToRemove))
  }

  function handleClearAll() {
    onChange([])
  }

  function openSearch() {
    if (disabled || isMaxReached) {
      return
    }

    setIsSearchOpen(true)
    setSearchQuery('')
    setSearchResults([])
    setSearchError(null)
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">추천 연관상품</h3>
          <p className="mt-1 text-sm text-neutral-500">
            고객에게 함께 보여줄 상품을 선택해주세요.
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            최대 {MAX_RELATED_PRODUCTS}개까지 선택할 수 있습니다. ({selectedProducts.length}/
            {MAX_RELATED_PRODUCTS})
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openSearch}
            disabled={disabled || isMaxReached}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + 상품 추가
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled || selectedProducts.length === 0}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            선택 해제
          </button>
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <ul className="mt-4 space-y-2">
          {selectedProducts.map((product, index) => (
            <li
              key={product.id}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">
                {index + 1}
              </span>
              <img
                src={product.thumbnail}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg border border-neutral-200 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
                <p className="mt-0.5 text-sm text-neutral-600">{formatPrice(product.price)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveProduct(product.id)}
                disabled={disabled}
                aria-label={`${product.name} 삭제`}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedProducts.length === 0 && (
        <p className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-6 text-center text-sm text-neutral-500">
          선택된 연관상품이 없습니다.
        </p>
      )}

      {isSearchOpen && (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
          <label htmlFor={searchInputId} className="mb-2 block text-sm font-medium text-neutral-700">
            상품명 검색
          </label>
          <input
            id={searchInputId}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="상품명을 입력하세요"
            autoFocus
            disabled={disabled}
            className={inputClassName}
          />

          <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-neutral-200">
            {isSearching && (
              <p className="px-4 py-3 text-sm text-neutral-500">검색 중...</p>
            )}

            {!isSearching && searchError && (
              <p role="alert" className="px-4 py-3 text-sm text-red-600">
                {searchError}
              </p>
            )}

            {!isSearching && !searchError && searchQuery.trim() && searchResults.length === 0 && (
              <p className="px-4 py-3 text-sm text-neutral-500">검색 결과가 없습니다.</p>
            )}

            {!isSearching && !searchError && searchResults.length > 0 && (
              <ul>
                {searchResults.map((product) => {
                  const isSelected = selectedIds.has(product.id)
                  const cannotAdd = isSelected || isMaxReached

                  return (
                    <li key={product.id} className="border-b border-neutral-100 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        disabled={disabled || cannotAdd}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <img
                          src={product.thumbnail}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-md border border-neutral-200 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-neutral-500">{formatPrice(product.price)}</p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-neutral-400">
                          {isSelected ? '선택됨' : '추가'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="mt-3 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            검색 닫기
          </button>
        </div>
      )}
    </div>
  )
}
