import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  galleryImagesFromUrls,
  hasDoneGalleryImage,
  type ProductGalleryImage,
} from '../ProductImageGalleryManager'
import {
  AdminProductDetailRepositoryError,
  fetchAdminProductDetail,
  saveAdminProductDetailDescription,
  saveAdminProductDetailPartial,
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
import {
  createEmptyPricingDraft,
  formatAdminNumericInput,
  pricingDraftFromForm,
  type AdminPricingNumericDraft,
} from '../../../../lib/adminNumericInput'
import { clearProductDraft } from '../../../../lib/adminProductDraftStorage'
import { generateProductSlugFromName, resolveUniqueProductSlug } from '../../../../lib/productSlug'
import { getProductStorefrontPath } from '../../../../lib/productStorefront'
import {
  galleryImagesDifferFromForm,
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
import {
  detectAdminProductDetailChanges,
  hasPersistableChanges,
  isDescriptionOnlyChanges,
  summarizeVariantStock,
} from './editor/productSaveChanges'
import { getSellerStepIndex, PRODUCT_SELLER_STEPS } from './productSellerSteps'
import { applyPricingDraftToForm } from './sections/AdminPricingFields'
import { ProductOptionsSection, applyVariantStockDraftToForm } from './sections/ProductOptionsSection'

function buildVariantStockDraft(
  variants: AdminProductDetailForm['variants'],
): Record<string, string> {
  return Object.fromEntries(
    variants.map((row) => [row.id, formatAdminNumericInput(row.stock)]),
  )
}

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
  const pricingDraftRef = useRef(createEmptyPricingDraft())
  const variantStockDraftRef = useRef<Record<string, string>>({})
  const [variantStockDraft, setVariantStockDraft] = useState<Record<string, string>>({})

  const handlePricingDraftChange = useCallback((draft: AdminPricingNumericDraft) => {
    pricingDraftRef.current = draft
  }, [])

  const handleVariantStockDraftChange = useCallback((draft: Record<string, string>) => {
    variantStockDraftRef.current = draft
    setVariantStockDraft(draft)
  }, [])

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
      setSaveError(null)
      setActiveStep('photos')
      pricingDraftRef.current = createEmptyPricingDraft()
      variantStockDraftRef.current = {}
      setVariantStockDraft({})

      try {
        const detail = await fetchAdminProductDetail(productId)
        const related = await fetchAdminRelatedProducts(productId)
        if (!cancelled) {
          pricingDraftRef.current = pricingDraftFromForm(detail)
          variantStockDraftRef.current = buildVariantStockDraft(detail.variants)
          setVariantStockDraft(variantStockDraftRef.current)
          setForm(detail)
          setRelatedProducts(related)
          setGalleryImages(galleryImagesFromUrls(collectGalleryPhotos(detail)))
          setSavedSnapshot(serializeEditorState(detail, related))
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

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (isDirty) {
        event.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  function handleClose() {
    if (isDirty && !window.confirm('저장하지 않은 변경 내용이 있습니다. 닫으시겠습니까?')) {
      return
    }

    onClose()
  }

  function updateForm<K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function prepareFormForSave(currentForm: AdminProductDetailForm): AdminProductDetailForm | null {
    const galleryChanged =
      galleryImages.length > 0 && galleryImagesDifferFromForm(galleryImages, currentForm)

    if (galleryChanged) {
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

    if (collectGalleryPhotos(currentForm).length === 0) {
      setSaveError('대표 이미지를 1장 이상 등록해 주세요.')
      return null
    }

    return currentForm
  }

  async function handleSave(closeAfter = false): Promise<AdminProductDetailForm | null> {
    setSaveError(null)
    setIsSaving(true)

    try {
      const withGallery = prepareFormForSave(form)
      if (!withGallery) {
        return null
      }

      if (!withGallery.name.trim()) {
        setSaveError('상품명을 입력해 주세요.')
        setActiveStep('info')
        return null
      }

      const dbBaseline = await fetchAdminProductDetail(productId)
      const dbRelated = await fetchAdminRelatedProducts(productId)
      const dbRelatedIds = dbRelated.map((item) => item.id)
      const nextRelatedIds = relatedProducts.map((item) => item.id)
      const changes = detectAdminProductDetailChanges(
        dbBaseline,
        withGallery,
        dbRelatedIds,
        nextRelatedIds,
      )

      if (!hasPersistableChanges(changes)) {
        showToast('변경된 내용이 없습니다.')
        return withGallery
      }

      let workingForm = withGallery

      if (changes.pricing || changes.simpleStock) {
        workingForm = applyPricingDraftToForm(workingForm, pricingDraftRef.current)
      }

      if (changes.options) {
        workingForm = applyVariantStockDraftToForm(
          workingForm,
          variantStockDraftRef.current,
        )
        workingForm = summarizeVariantStock(workingForm)
      }

      let savedForm: AdminProductDetailForm

      if (isDescriptionOnlyChanges(changes)) {
        const withSlug = await ensureProductSlug(workingForm)
        savedForm = await saveAdminProductDetailDescription(withSlug)
      } else {
        const withSlug = await ensureProductSlug(workingForm)
        savedForm = await saveAdminProductDetailPartial(withSlug, dbBaseline, changes)

        if (changes.related) {
          await saveAdminRelatedProducts(withSlug.id, nextRelatedIds)
        }
      }

      pricingDraftRef.current = pricingDraftFromForm(savedForm)
      variantStockDraftRef.current = buildVariantStockDraft(savedForm.variants)
      setVariantStockDraft(variantStockDraftRef.current)
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
          />
        )
      case 'info':
        return (
          <div className="space-y-6">
            <BasicInfoTab
              {...tabProps}
              onPricingDraftChange={handlePricingDraftChange}
              variantStockDraft={variantStockDraft}
            />
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
          <ProductOptionsSection
            {...tabProps}
            onVariantStockDraftChange={handleVariantStockDraftChange}
          />
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
            onClick={handleClose}
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
