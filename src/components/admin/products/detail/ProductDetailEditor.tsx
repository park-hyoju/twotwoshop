import { useEffect, useMemo, useState } from 'react'
import {
  galleryImagesFromUrls,
  hasDoneGalleryImage,
  type ProductGalleryImage,
} from '../ProductImageGalleryManager'
import {
  AdminProductDetailRepositoryError,
  fetchAdminProductDetail,
  saveAdminProductDetail,
} from '../../../../services/adminProductDetailRepository'
import {
  fetchAdminRelatedProducts,
  saveAdminRelatedProducts,
} from '../../../../services/adminProductRelatedRepository'
import type {
  AdminProductDetailForm,
  ProductSellerStep,
} from '../../../../types/adminProductDetail'
import type { RelatedProductPick } from '../../../../types/adminProductRelated'
import { createEmptyProductDetailForm } from '../../../../lib/adminProductDetailDefaults'
import { clearProductDraft, loadProductDraft } from '../../../../lib/adminProductDraftStorage'
import { generateProductSlugFromName, resolveUniqueProductSlug } from '../../../../lib/productSlug'
import { getProductStorefrontPath } from '../../../../lib/productStorefront'
import {
  hasBusyGalleryImage,
  syncGalleryImagesToForm,
} from '../../../../lib/syncProductGalleryToForm'
import { useAdminToast } from '../../AdminToast'
import { RelatedProductsSection } from '../RelatedProductsSection'
import { BasicInfoTab } from './BasicInfoTab'
import { DescriptionTab } from './DescriptionTab'
import { ProductSellerStepNav } from './ProductSellerStepNav'
import { SellerPhotosStep } from './steps/SellerPhotosStep'
import { SellerShippingStep } from './steps/SellerShippingStep'
import { collectGalleryPhotos } from './detailContent/detailContent'
import { adminSectionClassName } from './adminFormStyles'
import { serializeEditorState } from './editor/editorState'
import { getSellerStepIndex, PRODUCT_SELLER_STEPS } from './productSellerSteps'
import { ProductOptionsSection } from './sections/ProductOptionsSection'

interface ProductDetailEditorProps {
  productId: string
  onClose: () => void
  onSaved: (message: string) => void
}

import { AdminProductRepositoryError } from '../../../../services/adminProductRepository'

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminProductDetailRepositoryError) {
    return error.message
  }

  if (error instanceof AdminProductRepositoryError) {
    return error.message
  }

  return '상품 정보를 처리하는 중 문제가 생겼어요.'
}

async function ensureProductSlug(form: AdminProductDetailForm): Promise<AdminProductDetailForm> {
  if (form.slug.trim()) {
    return form
  }

  const base = generateProductSlugFromName(form.name) || `product-${Date.now().toString(36)}`
  const slug = await resolveUniqueProductSlug(base, form.id)

  return { ...form, slug }
}

export function ProductDetailEditor({ productId, onClose, onSaved }: ProductDetailEditorProps) {
  const [activeStep, setActiveStep] = useState<ProductSellerStep>('photos')
  const [form, setForm] = useState<AdminProductDetailForm>(() =>
    createEmptyProductDetailForm(productId),
  )
  const [galleryImages, setGalleryImages] = useState<ProductGalleryImage[]>([])
  const [relatedProducts, setRelatedProducts] = useState<RelatedProductPick[]>([])
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { showToast } = useAdminToast()

  const isDirty = useMemo(
    () =>
      savedSnapshot.length > 0 &&
      serializeEditorState(form, relatedProducts) !== savedSnapshot,
    [form, relatedProducts, savedSnapshot],
  )

  const storefrontPath = getProductStorefrontPath(form.slug)
  const canViewStorefront = Boolean(storefrontPath)
  const stepIndex = getSellerStepIndex(activeStep)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === PRODUCT_SELLER_STEPS.length - 1

  useEffect(() => {
    let cancelled = false

    async function loadDetail() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const detail = await fetchAdminProductDetail(productId)
        const related = await fetchAdminRelatedProducts(productId)
        const draft = loadProductDraft(productId)
        const nextForm = draft ?? detail
        if (!cancelled) {
          setForm(nextForm)
          setRelatedProducts(related)
          setGalleryImages(galleryImagesFromUrls(collectGalleryPhotos(nextForm)))
          setSavedSnapshot(serializeEditorState(detail, related))
          setActiveStep('photos')
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

  function prepareFormWithGallery(currentForm: AdminProductDetailForm): AdminProductDetailForm | null {
    if (hasBusyGalleryImage(galleryImages)) {
      setSaveError('이미지 업로드가 끝난 뒤 저장해 주세요.')
      return null
    }

    if (!hasDoneGalleryImage(galleryImages)) {
      setSaveError('대표 이미지를 1장 이상 등록해 주세요.')
      return null
    }

    const draft = { ...currentForm }
    syncGalleryImagesToForm(galleryImages, draft, (field, value) => {
      ;(draft as AdminProductDetailForm)[field] = value
    })
    return draft
  }

  async function handleSave(closeAfter = false): Promise<AdminProductDetailForm | null> {
    setSaveError(null)
    setIsSaving(true)

    try {
      const withGallery = prepareFormWithGallery(form)
      if (!withGallery) {
        return null
      }

      const withSlug = await ensureProductSlug(withGallery)
      const savedForm = await saveAdminProductDetail(withSlug)
      await saveAdminRelatedProducts(
        savedForm.id,
        relatedProducts.map((item) => item.id),
      )
      setForm(savedForm)
      setGalleryImages(galleryImagesFromUrls(collectGalleryPhotos(savedForm)))
      setSavedSnapshot(serializeEditorState(savedForm, relatedProducts))
      clearProductDraft(productId)
      const message = '저장되었습니다.'
      showToast(message)
      onSaved(message)

      if (closeAfter) {
        onClose()
      }

      return savedForm
    } catch (error) {
      setSaveError(getErrorMessage(error))
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function handleViewInStore() {
    const savedForm = await handleSave(false)
    if (!savedForm) {
      return
    }

    const path = getProductStorefrontPath(savedForm.slug.trim())
    if (!path) {
      setSaveError('저장 후 다시 시도해 주세요.')
      return
    }

    window.open(path, '_blank', 'noopener,noreferrer')
  }

  function goNext() {
    if (!isLastStep) {
      setActiveStep(PRODUCT_SELLER_STEPS[stepIndex + 1].id)
    }
  }

  function goPrev() {
    if (!isFirstStep) {
      setActiveStep(PRODUCT_SELLER_STEPS[stepIndex - 1].id)
    }
  }

  function renderStepContent() {
    const tabProps = { form, onChange: updateForm }

    switch (activeStep) {
      case 'photos':
        return (
          <SellerPhotosStep
            productId={productId}
            galleryImages={galleryImages}
            onGalleryChange={setGalleryImages}
            initialPhotoUrls={collectGalleryPhotos(form)}
          />
        )
      case 'info':
        return (
          <div className="space-y-6">
            <BasicInfoTab {...tabProps} />
            <div className={adminSectionClassName}>
              <RelatedProductsSection
                productId={productId}
                selectedProducts={relatedProducts}
                onChange={setRelatedProducts}
                disabled={isSaving}
              />
            </div>
          </div>
        )
      case 'options':
        return (
          <div className={adminSectionClassName}>
            <ProductOptionsSection {...tabProps} />
          </div>
        )
      case 'description':
        return <DescriptionTab {...tabProps} />
      case 'shipping':
        return (
          <div className={adminSectionClassName}>
            <SellerShippingStep {...tabProps} />
          </div>
        )
      default:
        return null
    }
  }

  const isSaveDisabled = isLoading || isSaving || Boolean(loadError)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-100">
      {isDirty && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          변경 내용이 아직 저장되지 않았습니다.
        </div>
      )}

      <header className="shrink-0 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <h2 className="truncate text-lg font-bold text-neutral-900">
            {form.name.trim() || '상품 등록'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-10 shrink-0 rounded-xl px-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            닫기
          </button>
        </div>
      </header>

      {!isLoading && !loadError && (
        <ProductSellerStepNav activeStep={activeStep} onStepChange={setActiveStep} />
      )}

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {isLoading && <p className="py-16 text-center text-neutral-500">불러오는 중...</p>}
        {!isLoading && loadError && (
          <p role="alert" className="py-16 text-center text-red-600">
            {loadError}
          </p>
        )}
        {!isLoading && !loadError && (
          <div className="mx-auto max-w-xl">
            {saveError && (
              <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveError}
              </p>
            )}
            {renderStepContent()}
          </div>
        )}
      </main>

      {!isLoading && !loadError && (
        <footer className="shrink-0 border-t border-neutral-200 bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-xl flex-col gap-3">
            <div className="flex gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={isSaving}
                  className="h-11 flex-1 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  이전
                </button>
              )}
              {!isLastStep && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={isSaving}
                  className="h-11 flex-1 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
                >
                  다음
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => void handleSave(false)}
              disabled={isSaveDisabled}
              className="h-12 w-full rounded-xl bg-neutral-900 text-base font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleSave(true)}
                disabled={isSaveDisabled}
                className="h-11 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
              >
                저장 후 닫기
              </button>
              {canViewStorefront && (
                <button
                  type="button"
                  onClick={() => void handleViewInStore()}
                  disabled={isSaveDisabled}
                  className="h-11 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  쇼핑몰에서 보기
                </button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
