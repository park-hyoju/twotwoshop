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
import {
  clearProductDraft,
  formatDraftSavedAtLabel,
  hasMeaningfulDraftDiff,
  isDraftOlderThanDatabase,
  loadProductDraft,
  saveProductDraft,
  type AdminProductDraftMode,
  type AdminProductDraftStatus,
  type ProductEditorDraft,
} from '../../../../lib/adminProductDraftStorage'
import { fetchAdminProductUpdatedAt } from '../../../../lib/adminProductUpdatedAt'
import { generateProductSlugFromName, resolveUniqueProductSlug } from '../../../../lib/productSlug'
import { getProductStorefrontPath } from '../../../../lib/productStorefront'
import {
  galleryImagesDifferFromForm,
  hasBusyGalleryImage,
  syncGalleryImagesToForm,
} from '../../../../lib/syncProductGalleryToForm'
import { useAdminAuth } from '../../../../contexts/AdminAuthProvider'
import { useAdminToast } from '../../AdminToast'
import { RelatedProductsSection } from '../RelatedProductsSection'
import { BasicInfoTab } from './BasicInfoTab'
import { DescriptionTab } from './DescriptionTab'
import { ProductSellerStepNav } from './ProductSellerStepNav'
import { ProductDraftRecoveryBanner } from './ProductDraftRecoveryBanner'
import { SellerPhotosStep } from './steps/SellerPhotosStep'
import { SellerShippingStep } from './steps/SellerShippingStep'
import { collectGalleryPhotos } from './detailContent/detailContent'
import { adminSectionClassName } from './adminFormStyles'
import { serializeEditorState } from './editor/editorState'
import {
  applyVariantStockDraftToForm,
  detectAdminProductDetailChanges,
  hasPersistableChanges,
  isDescriptionOnlyChanges,
  summarizeVariantStock,
} from './editor/productSaveChanges'
import { getSellerStepIndex, PRODUCT_SELLER_STEPS } from './productSellerSteps'
import { applyPricingDraftToForm } from './sections/AdminPricingFields'
import { ProductOptionsSection } from './sections/ProductOptionsSection'
import { isActiveSaveGeneration } from '../../../../lib/adminProductContinuousSave'
import { AdminProductRepositoryError } from '../../../../services/adminProductRepository'

const DRAFT_DEBOUNCE_MS = 1000

function buildVariantStockDraft(
  variants: AdminProductDetailForm['variants'],
): Record<string, string> {
  return Object.fromEntries(
    variants.map((row) => [row.id, formatAdminNumericInput(row.stock)]),
  )
}

function galleryHasPendingLocalFiles(images: ProductGalleryImage[]): boolean {
  return images.some(
    (image) =>
      Boolean(image.file) &&
      (!image.remoteUrl || image.status === 'pending' || image.status === 'cropping'),
  )
}

function buildDraftPersistForm(
  currentForm: AdminProductDetailForm,
  currentGallery: ProductGalleryImage[],
  pricingDraft: AdminPricingNumericDraft,
  variantStockDraft: Record<string, string>,
): AdminProductDetailForm {
  let next = { ...currentForm }

  if (currentGallery.length > 0 && galleryImagesDifferFromForm(currentGallery, next)) {
    if (!hasBusyGalleryImage(currentGallery) && hasDoneGalleryImage(currentGallery)) {
      syncGalleryImagesToForm(currentGallery, next, (field, value) => {
        ;(next as AdminProductDetailForm)[field] = value
      })
    }
  }

  next = applyPricingDraftToForm(next, pricingDraft)

  if (next.variants.length > 0 || next.optionGroups.length > 0) {
    next = applyVariantStockDraftToForm(next, variantStockDraft)
    next = summarizeVariantStock(next)
  }

  return next
}

interface ProductDetailEditorProps {
  productId: string
  editorMode?: AdminProductDraftMode
  onClose: () => void
  onSaved: (message: string) => void
}

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

function draftStatusLabel(
  status: AdminProductDraftStatus,
  lastSavedAt: string | null,
  isDirty: boolean,
): string {
  if (status === 'saving' || status === 'pending') {
    return '임시저장 중…'
  }
  if (status === 'error') {
    return '임시저장 실패'
  }
  if (status === 'saved' && lastSavedAt) {
    return formatDraftSavedAtLabel(lastSavedAt)
  }
  if (!isDirty) {
    return '저장된 변경사항 없음'
  }
  return '저장된 변경사항 없음'
}

export function ProductDetailEditor({
  productId,
  editorMode = 'edit',
  onClose,
  onSaved,
}: ProductDetailEditorProps) {
  const { user } = useAdminAuth()
  const adminUserId = user?.id ?? ''
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
  const [draftStatus, setDraftStatus] = useState<AdminProductDraftStatus>('idle')
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null)
  const [recoveryDraft, setRecoveryDraft] = useState<ProductEditorDraft | null>(null)
  const [draftAutosaveEnabled, setDraftAutosaveEnabled] = useState(false)
  const [showLocalImageWarning, setShowLocalImageWarning] = useState(false)
  const [databaseUpdatedAt, setDatabaseUpdatedAt] = useState<string | null>(null)
  const { showToast } = useAdminToast()
  const pricingDraftRef = useRef(createEmptyPricingDraft())
  const variantStockDraftRef = useRef<Record<string, string>>({})
  const [variantStockDraft, setVariantStockDraft] = useState<Record<string, string>>({})
  const saveInFlightRef = useRef(false)
  const saveGenerationRef = useRef(0)
  const formRef = useRef(form)
  const galleryImagesRef = useRef(galleryImages)
  const relatedProductsRef = useRef(relatedProducts)
  const activeStepRef = useRef(activeStep)
  const draftStatusRef = useRef(draftStatus)
  const databaseUpdatedAtRef = useRef(databaseUpdatedAt)
  const draftAutosaveEnabledRef = useRef(draftAutosaveEnabled)
  formRef.current = form
  galleryImagesRef.current = galleryImages
  relatedProductsRef.current = relatedProducts
  activeStepRef.current = activeStep
  draftStatusRef.current = draftStatus
  databaseUpdatedAtRef.current = databaseUpdatedAt
  draftAutosaveEnabledRef.current = draftAutosaveEnabled

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

  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  const storefrontPath = getProductStorefrontPath(form.slug)
  const canViewStorefront = Boolean(storefrontPath)
  const stepIndex = getSellerStepIndex(activeStep)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === PRODUCT_SELLER_STEPS.length - 1

  const flushDraftToStorage = useCallback(
    (reason: 'debounce' | 'visibility' | 'unload' | 'close'): boolean => {
      if (!adminUserId || !draftAutosaveEnabledRef.current || saveInFlightRef.current) {
        return false
      }

      if (!isDirtyRef.current) {
        setDraftStatus('clean')
        return true
      }

      try {
        if (reason !== 'unload') {
          setDraftStatus('saving')
        }

        const persistForm = buildDraftPersistForm(
          formRef.current,
          galleryImagesRef.current,
          pricingDraftRef.current,
          variantStockDraftRef.current,
        )
        const pendingLocalImages = galleryHasPendingLocalFiles(galleryImagesRef.current)
        const saved = saveProductDraft({
          adminUserId,
          productId,
          mode: editorMode,
          form: persistForm,
          relatedProducts: relatedProductsRef.current,
          activeStep: activeStepRef.current,
          pricingDraft: pricingDraftRef.current,
          variantStockDraft: variantStockDraftRef.current,
          pendingLocalImages,
          baselineUpdatedAt: databaseUpdatedAtRef.current,
        })

        setLastDraftSavedAt(saved.savedAt)
        setDraftStatus('saved')
        if (pendingLocalImages) {
          setShowLocalImageWarning(true)
        }
        return true
      } catch {
        setDraftStatus('error')
        return false
      }
    },
    [adminUserId, editorMode, productId],
  )

  useEffect(() => {
    let cancelled = false
    saveGenerationRef.current += 1
    saveInFlightRef.current = false
    setIsSaving(false)
    setRecoveryDraft(null)
    setDraftAutosaveEnabled(false)
    setDraftStatus('idle')
    setLastDraftSavedAt(null)
    setShowLocalImageWarning(false)
    setDatabaseUpdatedAt(null)

    async function loadDetail() {
      setIsLoading(true)
      setLoadError(null)
      setSaveError(null)
      setActiveStep('photos')
      pricingDraftRef.current = createEmptyPricingDraft()
      variantStockDraftRef.current = {}
      setVariantStockDraft({})
      setGalleryImages([])
      setRelatedProducts([])
      setSavedSnapshot('')
      setForm(createEmptyProductDetailForm(productId))

      try {
        const [detail, related, updatedAt] = await Promise.all([
          fetchAdminProductDetail(productId),
          fetchAdminRelatedProducts(productId),
          fetchAdminProductUpdatedAt(productId),
        ])
        if (cancelled) {
          return
        }

        pricingDraftRef.current = pricingDraftFromForm(detail)
        variantStockDraftRef.current = buildVariantStockDraft(detail.variants)
        setVariantStockDraft(variantStockDraftRef.current)
        setForm(detail)
        setRelatedProducts(related)
        setGalleryImages(galleryImagesFromUrls(collectGalleryPhotos(detail)))
        setSavedSnapshot(serializeEditorState(detail, related))
        setDatabaseUpdatedAt(updatedAt)

        if (adminUserId) {
          const draft = loadProductDraft(adminUserId, productId, editorMode)
          if (
            draft &&
            draft.adminUserId === adminUserId &&
            hasMeaningfulDraftDiff(draft, detail, related, serializeEditorState)
          ) {
            setRecoveryDraft(draft)
            setDraftAutosaveEnabled(false)
          } else {
            setDraftAutosaveEnabled(true)
            setDraftStatus('clean')
          }
        } else {
          setDraftAutosaveEnabled(true)
          setDraftStatus('clean')
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
      saveGenerationRef.current += 1
      saveInFlightRef.current = false
      // Flush draft before leaving this product editor (menu navigation / remount).
      if (draftAutosaveEnabledRef.current && isDirtyRef.current && adminUserId) {
        try {
          const persistForm = buildDraftPersistForm(
            formRef.current,
            galleryImagesRef.current,
            pricingDraftRef.current,
            variantStockDraftRef.current,
          )
          saveProductDraft({
            adminUserId,
            productId,
            mode: editorMode,
            form: persistForm,
            relatedProducts: relatedProductsRef.current,
            activeStep: activeStepRef.current,
            pricingDraft: pricingDraftRef.current,
            variantStockDraft: variantStockDraftRef.current,
            pendingLocalImages: galleryHasPendingLocalFiles(galleryImagesRef.current),
            baselineUpdatedAt: databaseUpdatedAtRef.current,
          })
        } catch {
          // Draft failure must never block navigation / unmount.
        }
      }
    }
  }, [productId, adminUserId, editorMode])

  useEffect(() => {
    if (!draftAutosaveEnabled || isLoading || Boolean(loadError) || !adminUserId) {
      return
    }

    if (!isDirty) {
      setDraftStatus((current) => (current === 'saved' ? current : 'clean'))
      return
    }

    setDraftStatus('pending')
    const timer = window.setTimeout(() => {
      flushDraftToStorage('debounce')
    }, DRAFT_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [
    form,
    relatedProducts,
    variantStockDraft,
    galleryImages,
    activeStep,
    isDirty,
    draftAutosaveEnabled,
    isLoading,
    loadError,
    adminUserId,
    flushDraftToStorage,
  ])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flushDraftToStorage('visibility')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [flushDraftToStorage])

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      const needsFlush =
        isDirtyRef.current &&
        (draftStatusRef.current === 'pending' || draftStatusRef.current === 'saving')

      if (needsFlush) {
        flushDraftToStorage('unload')
        event.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [flushDraftToStorage])

  function applyDraftToEditor(draft: ProductEditorDraft) {
    const nextForm = normalizeAppliedForm(productId, draft.form)
    setForm(nextForm)
    setRelatedProducts(draft.relatedProducts)
    setGalleryImages(galleryImagesFromUrls(collectGalleryPhotos(nextForm)))
    if (draft.pricingDraft) {
      pricingDraftRef.current = draft.pricingDraft
    } else {
      pricingDraftRef.current = pricingDraftFromForm(nextForm)
    }
    if (draft.variantStockDraft) {
      variantStockDraftRef.current = draft.variantStockDraft
      setVariantStockDraft(draft.variantStockDraft)
    } else {
      variantStockDraftRef.current = buildVariantStockDraft(nextForm.variants)
      setVariantStockDraft(variantStockDraftRef.current)
    }
    if (draft.activeStep) {
      setActiveStep(draft.activeStep)
    }
    setShowLocalImageWarning(draft.pendingLocalImages)
    setLastDraftSavedAt(draft.savedAt)
    setDraftStatus('saved')
  }

  function handleContinueDraft() {
    if (!recoveryDraft) {
      return
    }
    applyDraftToEditor(recoveryDraft)
    setRecoveryDraft(null)
    setDraftAutosaveEnabled(true)
  }

  function handleDiscardDraft() {
    if (adminUserId) {
      clearProductDraft(adminUserId, productId, editorMode)
    }
    setRecoveryDraft(null)
    setShowLocalImageWarning(false)
    setDraftAutosaveEnabled(true)
    setDraftStatus('clean')
    setLastDraftSavedAt(null)

    if (editorMode === 'create') {
      const empty = createEmptyProductDetailForm(productId)
      pricingDraftRef.current = createEmptyPricingDraft()
      variantStockDraftRef.current = {}
      setVariantStockDraft({})
      setForm(empty)
      setRelatedProducts([])
      setGalleryImages([])
      setActiveStep('photos')
      // Keep savedSnapshot as loaded DB baseline so dirty detection stays correct.
    }
  }

  function handleOpenDatabase() {
    if (adminUserId) {
      clearProductDraft(adminUserId, productId, editorMode)
    }
    setRecoveryDraft(null)
    setShowLocalImageWarning(false)
    setDraftAutosaveEnabled(true)
    setDraftStatus('clean')
    setLastDraftSavedAt(null)
  }

  function handleClose() {
    if (isDirty) {
      flushDraftToStorage('close')
    }

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

  const updateFormBatch = useCallback(
    (
      patch:
        | Partial<AdminProductDetailForm>
        | ((current: AdminProductDetailForm) => Partial<AdminProductDetailForm>),
    ) => {
      setForm((current) => {
        const resolved = typeof patch === 'function' ? patch(current) : patch
        return { ...current, ...resolved }
      })
    },
    [],
  )

  function prepareFormForSave(
    currentForm: AdminProductDetailForm,
    currentGallery: ProductGalleryImage[],
  ): AdminProductDetailForm | null {
    const galleryChanged =
      currentGallery.length > 0 && galleryImagesDifferFromForm(currentGallery, currentForm)

    if (galleryChanged) {
      if (hasBusyGalleryImage(currentGallery)) {
        setSaveError('이미지 업로드가 끝난 뒤 저장해 주세요.')
        return null
      }

      if (!hasDoneGalleryImage(currentGallery)) {
        setSaveError('대표 이미지를 1장 이상 등록해 주세요.')
        return null
      }

      const draft = { ...currentForm }
      syncGalleryImagesToForm(currentGallery, draft, (field, value) => {
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
    if (saveInFlightRef.current) {
      return null
    }

    const saveGeneration = saveGenerationRef.current
    saveInFlightRef.current = true
    setSaveError(null)
    setIsSaving(true)

    const isSaveCurrent = () =>
      isActiveSaveGeneration(saveGeneration, saveGenerationRef.current)

    try {
      const withGallery = prepareFormForSave(formRef.current, galleryImagesRef.current)
      if (!withGallery) {
        return null
      }

      if (!withGallery.name.trim()) {
        setSaveError('상품명을 입력해 주세요.')
        setActiveStep('info')
        return null
      }

      const dbBaseline = await fetchAdminProductDetail(productId)
      if (!isSaveCurrent()) {
        return null
      }

      const dbRelated = await fetchAdminRelatedProducts(productId)
      if (!isSaveCurrent()) {
        return null
      }

      const currentRelated = relatedProductsRef.current
      const dbRelatedIds = dbRelated.map((item) => item.id)
      const nextRelatedIds = currentRelated.map((item) => item.id)

      let workingForm = withGallery
      if (workingForm.variants.length > 0 || workingForm.optionGroups.length > 0) {
        workingForm = applyVariantStockDraftToForm(workingForm, variantStockDraftRef.current)
        workingForm = summarizeVariantStock(workingForm)
      }

      const changes = detectAdminProductDetailChanges(
        dbBaseline,
        workingForm,
        dbRelatedIds,
        nextRelatedIds,
      )

      if (!hasPersistableChanges(changes)) {
        if (isSaveCurrent()) {
          showToast('변경된 내용이 없습니다.')
        }
        return withGallery
      }

      if (changes.pricing || changes.simpleStock) {
        workingForm = applyPricingDraftToForm(workingForm, pricingDraftRef.current)
      }

      let savedForm: AdminProductDetailForm

      if (isDescriptionOnlyChanges(changes)) {
        const withSlug = await ensureProductSlug(workingForm)
        if (!isSaveCurrent()) {
          return null
        }
        savedForm = await saveAdminProductDetailDescription(withSlug)
      } else {
        const withSlug = await ensureProductSlug(workingForm)
        if (!isSaveCurrent()) {
          return null
        }
        savedForm = await saveAdminProductDetailPartial(withSlug, dbBaseline, changes)

        if (changes.related) {
          if (!isSaveCurrent()) {
            return null
          }
          await saveAdminRelatedProducts(withSlug.id, nextRelatedIds)
        }
      }

      if (!isSaveCurrent()) {
        return null
      }

      pricingDraftRef.current = pricingDraftFromForm(savedForm)
      variantStockDraftRef.current = buildVariantStockDraft(savedForm.variants)
      setVariantStockDraft(variantStockDraftRef.current)
      setForm(savedForm)
      setGalleryImages(galleryImagesFromUrls(collectGalleryPhotos(savedForm)))
      setSavedSnapshot(serializeEditorState(savedForm, currentRelated))
      if (adminUserId) {
        clearProductDraft(adminUserId, productId, editorMode)
      }
      setDraftStatus('clean')
      setLastDraftSavedAt(null)
      setShowLocalImageWarning(false)
      const refreshedUpdatedAt = await fetchAdminProductUpdatedAt(productId)
      setDatabaseUpdatedAt(refreshedUpdatedAt)
      const message = '저장되었습니다.'
      showToast(message)
      onSaved(message)

      if (closeAfter) {
        onClose()
      }

      return savedForm
    } catch (error) {
      if (isSaveCurrent()) {
        setSaveError(getErrorMessage(error))
      }
      return null
    } finally {
      if (isSaveCurrent()) {
        saveInFlightRef.current = false
        setIsSaving(false)
      }
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
            onBatchChange={updateFormBatch}
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
  const recoveryIsStale = recoveryDraft
    ? isDraftOlderThanDatabase(recoveryDraft.savedAt, databaseUpdatedAt)
    : false

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-100">
      {isDirty && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          변경 내용이 아직 저장되지 않았습니다.
        </div>
      )}

      <header className="shrink-0 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-neutral-900">
              {form.name.trim() || '상품 등록'}
            </h2>
            {!isLoading && !loadError && (
              <p className="mt-0.5 text-xs text-neutral-500">
                {draftStatusLabel(draftStatus, lastDraftSavedAt, isDirty)}
              </p>
            )}
          </div>
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
            {recoveryDraft && (
              <ProductDraftRecoveryBanner
                mode={editorMode === 'create' || recoveryDraft.mode === 'create' ? 'create' : 'edit'}
                savedAtLabel={formatDraftSavedAtLabel(recoveryDraft.savedAt)}
                isStale={recoveryIsStale}
                pendingLocalImages={recoveryDraft.pendingLocalImages}
                onContinue={handleContinueDraft}
                onDiscard={handleDiscardDraft}
                onOpenDatabase={handleOpenDatabase}
              />
            )}
            {showLocalImageWarning && !recoveryDraft && (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                선택한 새 이미지 파일은 페이지를 닫으면 다시 선택해야 할 수 있습니다.
              </p>
            )}
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
            <p className="text-center text-xs text-neutral-500">
              {draftStatusLabel(draftStatus, lastDraftSavedAt, isDirty)}
            </p>
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

function normalizeAppliedForm(productId: string, form: AdminProductDetailForm): AdminProductDetailForm {
  // Re-assert product id so a corrupted draft cannot switch target product.
  return { ...form, id: productId }
}
