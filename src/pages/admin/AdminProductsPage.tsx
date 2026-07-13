import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdminToast } from '../../components/admin/AdminToast'
import { AdminOrdersPagination } from '../../components/admin/orders/AdminOrdersPagination'
import { AdminProductsList, AdminProductsSearch } from '../../components/admin/products'
import { ProductDetailEditor } from '../../components/admin/products/detail'
import {
  AdminProductRepositoryError,
  deleteAdminProduct,
  fetchAdminProducts,
} from '../../services/adminProductRepository'
import { resolveDetailProductIdAfterEditorClose } from '../../lib/adminProductContinuousSave'
import {
  AdminProductDetailRepositoryError,
  copyAdminProduct,
  createBlankAdminProduct,
} from '../../services/adminProductDetailRepository'
import type {
  AdminProductRow,
  AdminProductSearchFilters,
  AdminProductStatusFilter,
} from '../../types/adminProduct'

const PAGE_SIZE = 20

const PRODUCT_STATUS_VALUES: AdminProductStatusFilter[] = ['all', 'active', 'soldout', 'hidden']

function isProductStatusFilter(value: string): value is AdminProductStatusFilter {
  return PRODUCT_STATUS_VALUES.includes(value as AdminProductStatusFilter)
}

const EMPTY_FILTERS: AdminProductSearchFilters = {
  name: '',
  slug: '',
  status: 'all',
  category: 'all',
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminProductRepositoryError) {
    return error.message
  }

  if (error instanceof AdminProductDetailRepositoryError) {
    return error.message
  }

  return '상품 목록을 불러오는 중 오류가 발생했습니다.'
}

export function AdminProductsPage() {
  const { showToast } = useAdminToast()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<AdminProductRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [draftFilters, setDraftFilters] = useState<AdminProductSearchFilters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AdminProductSearchFilters>(EMPTY_FILTERS)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null)
  const [actionProductId, setActionProductId] = useState<string | null>(null)
  const [detailProductId, setDetailProductId] = useState<string | null>(null)
  const createInFlightRef = useRef(false)

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await fetchAdminProducts({
        page,
        pageSize: PAGE_SIZE,
        filters: appliedFilters,
      })

      setProducts(result.products)
      setTotalCount(result.totalCount)
    } catch (error) {
      setProducts([])
      setTotalCount(0)
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [appliedFilters, page])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    const statusParam = searchParams.get('status')
    const slugParam = searchParams.get('slug')
    let nextFilters = { ...EMPTY_FILTERS }

    if (statusParam && isProductStatusFilter(statusParam) && statusParam !== 'all') {
      nextFilters = { ...nextFilters, status: statusParam }
    }

    if (slugParam) {
      nextFilters = { ...nextFilters, slug: slugParam }
    }

    if (
      nextFilters.status !== EMPTY_FILTERS.status ||
      nextFilters.slug !== EMPTY_FILTERS.slug
    ) {
      setDraftFilters(nextFilters)
      setAppliedFilters(nextFilters)
      setPage(1)
    }
  }, [searchParams])

  function handleFilterChange(field: keyof AdminProductSearchFilters, value: string) {
    setDraftFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSearch() {
    setPage(1)
    setAppliedFilters({ ...draftFilters })
  }

  function handleReset() {
    setDraftFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setPage(1)
  }

  async function handleCreate() {
    if (createInFlightRef.current) {
      return
    }

    createInFlightRef.current = true
    setActionErrorMessage(null)
    setActionProductId('create')

    try {
      const productId = await createBlankAdminProduct()
      setDetailProductId(productId)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[AdminProductsPage] create product failed', error)
      }
      const message = getErrorMessage(error)
      setActionErrorMessage(message)
      showToast(message, { durationMs: 6000 })
    } finally {
      createInFlightRef.current = false
      setActionProductId(null)
    }
  }

  function openDetailEditor(product: AdminProductRow) {
    setDetailProductId(product.id)
  }

  function closeDetailEditor(editorProductId: string) {
    // Ignore stale onClose from a previous product's in-flight "저장 후 닫기".
    setDetailProductId((current) =>
      resolveDetailProductIdAfterEditorClose(current, editorProductId),
    )
    void loadProducts()
  }

  function handleDetailSaved(_message: string) {
    void loadProducts()
  }

  async function handleCopy(product: AdminProductRow) {
    setActionErrorMessage(null)
    setActionProductId(product.id)

    try {
      const copiedId = await copyAdminProduct(product.id)
      await loadProducts()
      showToast('상품이 복사되었습니다. 사진과 상품명을 수정한 뒤 저장하세요.')
      setDetailProductId(copiedId)
    } catch (error) {
      const message = getErrorMessage(error)
      setActionErrorMessage(message)
      showToast(message, { durationMs: 4000 })
    } finally {
      setActionProductId(null)
    }
  }

  async function handleDelete(product: AdminProductRow) {
    const confirmed = window.confirm(`"${product.name}" 상품을 삭제하시겠습니까?`)

    if (!confirmed) {
      return
    }

    setActionErrorMessage(null)
    setActionProductId(product.id)

    try {
      await deleteAdminProduct(product.id)
      await loadProducts()
      showToast('상품이 삭제되었습니다.')
    } catch (error) {
      const message = getErrorMessage(error)
      setActionErrorMessage(message)
      showToast(message, { durationMs: 4000 })
    } finally {
      setActionProductId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">상품 관리</h1>
          <p className="mt-2 text-base text-neutral-600">
            사진부터 순서대로 입력해 빠르게 상품을 등록하세요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={actionProductId === 'create'}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 sm:text-base"
        >
          상품 추가
        </button>
      </div>

      <div className="mt-6">
        <AdminProductsSearch
          filters={draftFilters}
          onChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleReset}
        />
      </div>

      {actionErrorMessage && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:text-base"
        >
          {actionErrorMessage}
        </p>
      )}

      <div className="mt-6">
        {isLoading && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-base text-neutral-600">상품 목록을 불러오는 중입니다...</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
          >
            <p className="text-base font-medium text-red-700">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadProducts()}
              className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && products.length === 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-base text-neutral-600">등록된 상품이 없습니다.</p>
          </div>
        )}

        {!isLoading && !errorMessage && products.length > 0 && (
          <div className="space-y-4">
            <AdminProductsList
              products={products}
              actionProductId={actionProductId}
              onDetailEdit={openDetailEditor}
              onCopy={(product) => void handleCopy(product)}
              onDelete={(product) => void handleDelete(product)}
            />
            <AdminOrdersPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {detailProductId && (
        <ProductDetailEditor
          key={detailProductId}
          productId={detailProductId}
          onClose={() => closeDetailEditor(detailProductId)}
          onSaved={handleDetailSaved}
        />
      )}
    </div>
  )
}
