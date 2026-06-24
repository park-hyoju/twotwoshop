import { useEffect, useMemo, useState } from 'react'
import {
  AdminProductDetailRepositoryError,
  fetchAdminProductDetail,
  saveAdminProductDetail,
} from '../../../../services/adminProductDetailRepository'
import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'
import { createEmptyProductDetailForm } from '../../../../lib/adminProductDetailDefaults'
import { clearProductDraft, loadProductDraft } from '../../../../lib/adminProductDraftStorage'
import { getProductStorefrontPath } from '../../../../lib/productStorefront'
import { useAdminToast } from '../../AdminToast'
import { ProductEditorForm } from './editor/ProductEditorForm'
import {
  ProductEditorScrollNav,
  useActiveEditorSection,
} from './editor/ProductEditorScrollNav'
import { serializeFormForDirtyCheck } from './editor/productEditorSections'

interface ProductDetailEditorProps {
  productId: string
  onClose: () => void
  onSaved: (message: string) => void
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminProductDetailRepositoryError) {
    return error.message
  }

  return '상품 정보를 처리하는 중 문제가 생겼어요.'
}

export function ProductDetailEditor({ productId, onClose, onSaved }: ProductDetailEditorProps) {
  const [form, setForm] = useState<AdminProductDetailForm>(() =>
    createEmptyProductDetailForm(productId),
  )
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { showToast } = useAdminToast()
  const { activeSection, scrollToSection } = useActiveEditorSection(!isLoading && !loadError)

  const isDirty = useMemo(
    () => savedSnapshot.length > 0 && serializeFormForDirtyCheck(form) !== savedSnapshot,
    [form, savedSnapshot],
  )

  const storefrontPath = getProductStorefrontPath(form.slug)
  const canViewStorefront = Boolean(storefrontPath)

  useEffect(() => {
    let cancelled = false

    async function loadDetail() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const detail = await fetchAdminProductDetail(productId)
        const draft = loadProductDraft(productId)
        if (!cancelled) {
          setForm(draft ?? detail)
          setSavedSnapshot(serializeFormForDirtyCheck(detail))
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      cancelled = true
    }
  }, [productId])

  function updateForm<K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave(): Promise<AdminProductDetailForm | null> {
    setSaveError(null)
    setIsSaving(true)

    try {
      const savedForm = await saveAdminProductDetail(form)
      setForm(savedForm)
      setSavedSnapshot(serializeFormForDirtyCheck(savedForm))
      clearProductDraft(productId)
      const message = '상품이 저장되었습니다.'
      showToast(message)
      onSaved(message)
      return savedForm
    } catch (error) {
      setSaveError(getErrorMessage(error))
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveAndClose() {
    const savedForm = await handleSave()
    if (savedForm) {
      onClose()
    }
  }

  async function handleViewInStore() {
    let slug = form.slug.trim()

    if (isDirty) {
      const savedForm = await handleSave()
      if (!savedForm) {
        return
      }
      slug = savedForm.slug.trim()
    }

    const path = getProductStorefrontPath(slug)
    if (!path) {
      setSaveError('상품 주소가 없어요. 저장 후 다시 시도해 주세요.')
      return
    }

    window.open(path, '_blank', 'noopener,noreferrer')
  }

  const isSaveDisabled = isLoading || isSaving || Boolean(loadError)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-50">
      {isDirty && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-900">
          저장되지 않은 변경사항이 있습니다.
        </div>
      )}

      <header className="shrink-0 border-b border-neutral-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-neutral-500">상품 수정</p>
            <h2 className="truncate text-xl font-bold text-neutral-900 sm:text-2xl">
              {form.name || '새 상품'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-11 rounded-xl px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={() => void handleViewInStore()}
              disabled={isSaveDisabled || (!canViewStorefront && !isDirty)}
              className="h-11 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              쇼핑몰에서 보기
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaveDisabled}
              className="h-11 rounded-xl border border-neutral-200 px-4 text-sm font-bold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => void handleSaveAndClose()}
              disabled={isSaveDisabled}
              className="h-11 rounded-xl bg-neutral-900 px-5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              저장 후 닫기
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {!isLoading && !loadError && (
          <ProductEditorScrollNav
            form={form}
            activeSection={activeSection}
            onSectionClick={scrollToSection}
          />
        )}

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
          {isLoading && <p className="py-20 text-center text-neutral-500">불러오는 중...</p>}
          {!isLoading && loadError && (
            <p role="alert" className="py-20 text-center text-red-600">
              {loadError}
            </p>
          )}
          {!isLoading && !loadError && (
            <div className="mx-auto max-w-2xl">
              {saveError && (
                <p role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </p>
              )}
              <ProductEditorForm form={form} onChange={updateForm} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
