import { useCallback, useEffect, useState } from 'react'
import { AdminOrdersPagination } from '../../components/admin/orders/AdminOrdersPagination'
import {
  AdminProductFormModal,
  AdminProductsList,
  AdminProductsSearch,
  type AdminProductFormMode,
} from '../../components/admin/products'
import { ProductDetailEditor } from '../../components/admin/products/detail'
import {
  AdminProductRepositoryError,
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  setAdminProductSoldOut,
  setAdminProductVisibility,
  updateAdminProduct,
} from '../../services/adminProductRepository'
import type {
  AdminProductFormInput,
  AdminProductRow,
  AdminProductSearchFilters,
} from '../../types/adminProduct'

const PAGE_SIZE = 20

const EMPTY_FILTERS: AdminProductSearchFilters = {
  name: '',
  slug: '',
  status: 'all',
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminProductRepositoryError) {
    return error.message
  }

  return '상품 목록을 불러오는 중 오류가 발생했습니다.'
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [draftFilters, setDraftFilters] = useState<AdminProductSearchFilters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AdminProductSearchFilters>(EMPTY_FILTERS)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null)
  const [actionProductId, setActionProductId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<AdminProductFormMode | null>(null)
  const [editingProduct, setEditingProduct] = useState<AdminProductRow | null>(null)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [detailProductId, setDetailProductId] = useState<string | null>(null)
  const [detailSaveMessage, setDetailSaveMessage] = useState<string | null>(null)

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

  function openCreateForm() {
    setFormErrorMessage(null)
    setEditingProduct(null)
    setFormMode('create')
  }

  function openEditForm(product: AdminProductRow) {
    setFormErrorMessage(null)
    setEditingProduct(product)
    setFormMode('edit')
  }

  function closeForm() {
    if (isFormSubmitting) {
      return
    }

    setFormMode(null)
    setEditingProduct(null)
    setFormErrorMessage(null)
  }

  async function runProductAction(
    productId: string,
    action: () => Promise<void>,
    fallbackMessage: string,
  ) {
    setActionErrorMessage(null)
    setActionProductId(productId)

    try {
      await action()
      await loadProducts()
    } catch (error) {
      setActionErrorMessage(
        error instanceof AdminProductRepositoryError ? error.message : fallbackMessage,
      )
    } finally {
      setActionProductId(null)
    }
  }

  async function handleFormSubmit(input: AdminProductFormInput) {
    setFormErrorMessage(null)
    setIsFormSubmitting(true)

    try {
      if (formMode === 'create') {
        await createAdminProduct(input)
      } else if (formMode === 'edit' && editingProduct) {
        await updateAdminProduct(editingProduct.id, {
          price: input.price,
          stock: input.stock,
          status: input.status,
          display_category: input.display_category,
        })
      }

      closeForm()
      await loadProducts()
    } catch (error) {
      setFormErrorMessage(
        error instanceof AdminProductRepositoryError
          ? error.message
          : '상품 저장 중 오류가 발생했습니다.',
      )
    } finally {
      setIsFormSubmitting(false)
    }
  }

  function openDetailEditor(product: AdminProductRow) {
    setDetailSaveMessage(null)
    setDetailProductId(product.id)
  }

  function closeDetailEditor() {
    setDetailProductId(null)
  }

  function handleDetailSaved(message: string) {
    setDetailSaveMessage(message)
    void loadProducts()
  }

  async function handleDelete(product: AdminProductRow) {
    const confirmed = window.confirm(`"${product.name}" 상품을 삭제하시겠습니까?`)

    if (!confirmed) {
      return
    }

    await runProductAction(
      product.id,
      () => deleteAdminProduct(product.id),
      '상품 삭제 중 오류가 발생했습니다.',
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">상품 관리</h1>
          <p className="mt-2 text-base text-neutral-600 sm:text-lg">
            상품 등록, 재고, 노출 상태를 관리합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 sm:text-base"
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

      {detailSaveMessage && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 sm:text-base"
        >
          {detailSaveMessage}
        </p>
      )}

      <div className="mt-6">
        {isLoading && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-base text-neutral-600 sm:text-lg">상품 목록을 불러오는 중입니다...</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
          >
            <p className="text-base font-medium text-red-700 sm:text-lg">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadProducts()}
              className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800 sm:text-base"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && products.length === 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-base text-neutral-600 sm:text-lg">등록된 상품이 없습니다.</p>
          </div>
        )}

        {!isLoading && !errorMessage && products.length > 0 && (
          <div className="space-y-4">
            <AdminProductsList
              products={products}
              actionProductId={actionProductId}
              onEdit={openEditForm}
              onDetailEdit={openDetailEditor}
              onDelete={(product) => void handleDelete(product)}
              onSoldOut={(productId) =>
                void runProductAction(
                  productId,
                  () => setAdminProductSoldOut(productId),
                  '품절 처리 중 오류가 발생했습니다.',
                )
              }
              onToggleVisibility={(productId, visible) =>
                void runProductAction(
                  productId,
                  () => setAdminProductVisibility(productId, visible),
                  '노출 상태 변경 중 오류가 발생했습니다.',
                )
              }
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

      {formMode && (
        <AdminProductFormModal
          mode={formMode}
          product={editingProduct}
          isOpen={formMode !== null}
          isSubmitting={isFormSubmitting}
          errorMessage={formErrorMessage}
          onClose={closeForm}
          onSubmit={(input) => void handleFormSubmit(input)}
        />
      )}

      {detailProductId && (
        <ProductDetailEditor
          productId={detailProductId}
          onClose={closeDetailEditor}
          onSaved={handleDetailSaved}
        />
      )}
    </div>
  )
}
