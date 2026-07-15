import { createEmptyProductDetailForm } from './adminProductDetailDefaults'
import type {
  AdminProductDetailForm,
  AdminProductVariant,
  ProductSellerStep,
} from '../types/adminProductDetail'
import type { RelatedProductPick } from '../types/adminProductRelated'
import type { AdminPricingNumericDraft } from './adminNumericInput'

/** Public key prefix. Includes admin user id to avoid cross-account draft leaks. */
export const ADMIN_PRODUCT_DRAFT_KEY_PREFIX = 'admin_product_draft:'

/** Legacy key from earlier draft helper (migrated on load, then removed). */
const LEGACY_DRAFT_KEY_PREFIX = 'twotwoshop-product-draft:'

export const ADMIN_PRODUCT_DRAFT_VERSION = 1 as const

export type AdminProductDraftMode = 'create' | 'edit'

export type AdminProductDraftStatus =
  | 'idle'
  | 'clean'
  | 'pending'
  | 'saving'
  | 'saved'
  | 'error'

export interface ProductEditorDraft {
  version: typeof ADMIN_PRODUCT_DRAFT_VERSION
  savedAt: string
  adminUserId: string
  productId: string
  mode: AdminProductDraftMode
  form: AdminProductDetailForm
  relatedProducts: RelatedProductPick[]
  activeStep: ProductSellerStep | null
  pricingDraft: AdminPricingNumericDraft | null
  variantStockDraft: Record<string, string> | null
  /** True when local File images existed at draft write time (cannot persist Files). */
  pendingLocalImages: boolean
  /** products.updated_at when draft was written (ISO), for stale warnings. */
  baselineUpdatedAt: string | null
}

export interface SaveProductDraftInput {
  adminUserId: string
  productId: string
  mode: AdminProductDraftMode
  form: AdminProductDetailForm
  relatedProducts?: RelatedProductPick[]
  activeStep?: ProductSellerStep | null
  pricingDraft?: AdminPricingNumericDraft | null
  variantStockDraft?: Record<string, string> | null
  pendingLocalImages?: boolean
  baselineUpdatedAt?: string | null
  savedAt?: string
}

function getDraftKey(adminUserId: string, productId: string): string {
  return `${ADMIN_PRODUCT_DRAFT_KEY_PREFIX}${adminUserId}:${productId}`
}

function getCreateDraftKey(adminUserId: string): string {
  return `${ADMIN_PRODUCT_DRAFT_KEY_PREFIX}${adminUserId}:new`
}

function getLegacyDraftKey(productId: string): string {
  return `${LEGACY_DRAFT_KEY_PREFIX}${productId}`
}

function normalizeVariant(variant: Partial<AdminProductVariant>, index: number): AdminProductVariant {
  return {
    id: typeof variant.id === 'string' && variant.id.trim() ? variant.id.trim() : `variant-${index}`,
    options: variant.options && typeof variant.options === 'object' ? variant.options : {},
    stock: typeof variant.stock === 'number' && Number.isFinite(variant.stock) ? Math.max(0, variant.stock) : 0,
    extraPrice:
      typeof variant.extraPrice === 'number' && Number.isFinite(variant.extraPrice)
        ? Math.max(0, variant.extraPrice)
        : 0,
    sku: typeof variant.sku === 'string' ? variant.sku : '',
    color: typeof variant.color === 'string' ? variant.color : '',
    size: typeof variant.size === 'string' ? variant.size : '',
  }
}

export function normalizeProductDetailForm(
  productId: string,
  value: Partial<AdminProductDetailForm>,
): AdminProductDetailForm {
  const base = createEmptyProductDetailForm(productId)

  return {
    ...base,
    ...value,
    id: productId,
    optionGroups: Array.isArray(value.optionGroups) ? value.optionGroups : [],
    variants: Array.isArray(value.variants)
      ? value.variants.map((variant, index) => normalizeVariant(variant, index))
      : [],
    detail_media: Array.isArray(value.detail_media) ? value.detail_media : [],
    images: Array.isArray(value.images) ? value.images : [],
    size_guide: value.size_guide ?? base.size_guide,
    product_info: value.product_info ?? base.product_info,
    shipping_info: value.shipping_info ?? base.shipping_info,
    return_info: value.return_info ?? base.return_info,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeRelatedProducts(value: unknown): RelatedProductPick[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : '',
      slug: typeof item.slug === 'string' ? item.slug : '',
      name: typeof item.name === 'string' ? item.name : '',
      price: typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0,
      thumbnail: typeof item.thumbnail === 'string' ? item.thumbnail : '',
    }))
    .filter((item) => item.id.trim().length > 0)
}

function normalizePricingDraft(value: unknown): AdminPricingNumericDraft | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    originalPrice: typeof value.originalPrice === 'string' ? value.originalPrice : '',
    price: typeof value.price === 'string' ? value.price : '',
    stock: typeof value.stock === 'string' ? value.stock : '',
    discountRate: typeof value.discountRate === 'string' ? value.discountRate : '',
  }
}

function normalizeVariantStockDraft(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) {
    return null
  }

  const next: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      next[key] = entry
    }
  }
  return next
}

function normalizeActiveStep(value: unknown): ProductSellerStep | null {
  if (
    value === 'photos' ||
    value === 'info' ||
    value === 'options' ||
    value === 'description' ||
    value === 'shipping'
  ) {
    return value
  }
  return null
}

/** Returns true when draft was saved before the current DB updated_at. */
export function isDraftOlderThanDatabase(
  draftSavedAt: string,
  databaseUpdatedAt: string | null | undefined,
): boolean {
  if (!databaseUpdatedAt) {
    return false
  }

  const draftMs = Date.parse(draftSavedAt)
  const dbMs = Date.parse(databaseUpdatedAt)
  if (!Number.isFinite(draftMs) || !Number.isFinite(dbMs)) {
    return false
  }

  return draftMs < dbMs
}

export function formatDraftSavedAtLabel(savedAt: string, now = new Date()): string {
  const date = new Date(savedAt)
  if (!Number.isFinite(date.getTime())) {
    return '임시저장 완료'
  }

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = hours < 12 ? '오전' : '오후'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12

  if (sameDay) {
    return `${period} ${hour12}:${minutes} 임시저장 완료`
  }

  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day} ${period} ${hour12}:${minutes} 임시저장 완료`
}

export function parseProductEditorDraft(
  productId: string,
  adminUserId: string,
  raw: string,
): ProductEditorDraft | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) {
      return null
    }

    // Legacy shape: { form, relatedProducts } or bare form fields
    const formSource = isRecord(parsed.form)
      ? (parsed.form as Partial<AdminProductDetailForm>)
      : (parsed as Partial<AdminProductDetailForm>)

    if (typeof formSource !== 'object' || formSource === null) {
      return null
    }

    const savedAt =
      typeof parsed.savedAt === 'string' && parsed.savedAt.trim()
        ? parsed.savedAt
        : new Date(0).toISOString()

    const mode: AdminProductDraftMode = parsed.mode === 'create' ? 'create' : 'edit'

    return {
      version: ADMIN_PRODUCT_DRAFT_VERSION,
      savedAt,
      adminUserId:
        typeof parsed.adminUserId === 'string' && parsed.adminUserId.trim()
          ? parsed.adminUserId
          : adminUserId,
      productId,
      mode,
      form: normalizeProductDetailForm(productId, formSource),
      relatedProducts: normalizeRelatedProducts(parsed.relatedProducts),
      activeStep: normalizeActiveStep(parsed.activeStep),
      pricingDraft: normalizePricingDraft(parsed.pricingDraft),
      variantStockDraft: normalizeVariantStockDraft(parsed.variantStockDraft),
      pendingLocalImages: Boolean(parsed.pendingLocalImages),
      baselineUpdatedAt:
        typeof parsed.baselineUpdatedAt === 'string' ? parsed.baselineUpdatedAt : null,
    }
  } catch {
    return null
  }
}

function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function saveProductDraft(input: SaveProductDraftInput): ProductEditorDraft {
  const {
    adminUserId,
    productId,
    mode,
    form,
    relatedProducts = [],
    activeStep = null,
    pricingDraft = null,
    variantStockDraft = null,
    pendingLocalImages = false,
    baselineUpdatedAt = null,
    savedAt = new Date().toISOString(),
  } = input

  if (!adminUserId.trim() || !productId.trim()) {
    throw new Error('DRAFT_KEY_REQUIRED')
  }

  const draft: ProductEditorDraft = {
    version: ADMIN_PRODUCT_DRAFT_VERSION,
    savedAt,
    adminUserId,
    productId,
    mode,
    form: normalizeProductDetailForm(productId, form),
    relatedProducts: normalizeRelatedProducts(relatedProducts),
    activeStep,
    pricingDraft,
    variantStockDraft,
    pendingLocalImages,
    baselineUpdatedAt,
  }

  try {
    const serialized = JSON.stringify(draft)
    localStorage.setItem(getDraftKey(adminUserId, productId), serialized)
    if (mode === 'create') {
      localStorage.setItem(getCreateDraftKey(adminUserId), serialized)
    }
    // Drop legacy key after successful write.
    removeKey(getLegacyDraftKey(productId))
  } catch (error) {
    throw error instanceof Error ? error : new Error('DRAFT_SAVE_FAILED')
  }

  return draft
}

export function loadProductDraft(
  adminUserId: string,
  productId: string,
  mode: AdminProductDraftMode = 'edit',
): ProductEditorDraft | null {
  if (!adminUserId.trim() || !productId.trim()) {
    return null
  }

  try {
    const primaryRaw = localStorage.getItem(getDraftKey(adminUserId, productId))
    if (primaryRaw) {
      const draft = parseProductEditorDraft(productId, adminUserId, primaryRaw)
      if (draft && draft.adminUserId === adminUserId) {
        return draft
      }
      removeKey(getDraftKey(adminUserId, productId))
    }

    if (mode === 'create') {
      const createRaw = localStorage.getItem(getCreateDraftKey(adminUserId))
      if (createRaw) {
        const draft = parseProductEditorDraft(productId, adminUserId, createRaw)
        if (draft && draft.adminUserId === adminUserId && draft.form.id === productId) {
          return draft
        }
      }
    }

    const legacyRaw = localStorage.getItem(getLegacyDraftKey(productId))
    if (legacyRaw) {
      const draft = parseProductEditorDraft(productId, adminUserId, legacyRaw)
      if (draft) {
        // Migrate legacy (no admin id) into the current admin's scoped key only.
        const migrated = { ...draft, adminUserId }
        try {
          saveProductDraft({
            adminUserId,
            productId,
            mode: draft.mode,
            form: migrated.form,
            relatedProducts: migrated.relatedProducts,
            activeStep: migrated.activeStep,
            pricingDraft: migrated.pricingDraft,
            variantStockDraft: migrated.variantStockDraft,
            pendingLocalImages: migrated.pendingLocalImages,
            baselineUpdatedAt: migrated.baselineUpdatedAt,
            savedAt: migrated.savedAt,
          })
        } catch {
          // keep returning parsed draft even if migrate write fails
        }
        return migrated
      }
      removeKey(getLegacyDraftKey(productId))
    }

    return null
  } catch {
    return null
  }
}

export function clearProductDraft(
  adminUserId: string | null | undefined,
  productId: string,
  mode?: AdminProductDraftMode,
): void {
  if (productId.trim()) {
    removeKey(getLegacyDraftKey(productId))
  }

  if (adminUserId?.trim() && productId.trim()) {
    removeKey(getDraftKey(adminUserId, productId))
  }

  if (adminUserId?.trim() && (mode === 'create' || mode === undefined)) {
    try {
      const createRaw = localStorage.getItem(getCreateDraftKey(adminUserId))
      if (!createRaw) {
        return
      }
      if (mode === 'create') {
        removeKey(getCreateDraftKey(adminUserId))
        return
      }
      const parsed = JSON.parse(createRaw) as { productId?: string; form?: { id?: string } }
      const createProductId =
        typeof parsed.productId === 'string'
          ? parsed.productId
          : typeof parsed.form?.id === 'string'
            ? parsed.form.id
            : null
      if (createProductId === productId) {
        removeKey(getCreateDraftKey(adminUserId))
      }
    } catch {
      removeKey(getCreateDraftKey(adminUserId))
    }
  }
}

/** Removes all drafts owned by this admin (call on logout). */
export function clearAllProductDraftsForAdmin(adminUserId: string): void {
  if (!adminUserId.trim()) {
    return
  }

  try {
    const prefix = `${ADMIN_PRODUCT_DRAFT_KEY_PREFIX}${adminUserId}:`
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      removeKey(key)
    }
  } catch {
    // ignore
  }
}

export function hasMeaningfulDraftDiff(
  draft: ProductEditorDraft,
  serverForm: AdminProductDetailForm,
  serverRelated: RelatedProductPick[],
  serialize: (form: AdminProductDetailForm, related: RelatedProductPick[]) => string,
): boolean {
  return serialize(draft.form, draft.relatedProducts) !== serialize(serverForm, serverRelated)
}
