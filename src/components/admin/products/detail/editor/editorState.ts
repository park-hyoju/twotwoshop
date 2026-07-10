import {
  getVariantOptionKey,
  getVariantTotalStock,
  normalizeOptionGroupsInput,
} from '../../../../../lib/adminProductOptions'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { RelatedProductPick } from '../../../../../types/adminProductRelated'
import type { AdminPricingNumericDraft } from '../../../../../lib/adminNumericInput'

const DESCRIPTION_FIELD_KEYS = ['description', 'detail_media', 'short_description'] as const

type DescriptionFieldKey = (typeof DESCRIPTION_FIELD_KEYS)[number]

/** Stable form shape for dirty checks — ignores variant ids and normalizes options. */
export function canonicalizeFormForSnapshot(form: AdminProductDetailForm): AdminProductDetailForm {
  const optionGroups = normalizeOptionGroupsInput(form.optionGroups).map((group) => ({
    id: group.id,
    name: group.name.trim(),
    valuesInput: group.valuesInput.trim(),
  }))

  const variants = [...form.variants]
    .map((variant) => ({
      id: getVariantOptionKey(variant.options ?? {}),
      options: variant.options ?? {},
      stock: variant.stock,
      extraPrice: variant.extraPrice,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
    }))
    .sort((left, right) => left.id.localeCompare(right.id, 'ko'))

  const stock = variants.length > 0 ? getVariantTotalStock(variants) : form.stock

  return {
    ...form,
    optionGroups,
    variants,
    stock,
  }
}

export function serializeEditorState(
  form: AdminProductDetailForm,
  relatedProducts: RelatedProductPick[],
): string {
  return JSON.stringify({
    form: canonicalizeFormForSnapshot(form),
    relatedProductIds: [...relatedProducts.map((item) => item.id)].sort(),
  })
}

export function parseEditorState(
  snapshot: string,
): { form: AdminProductDetailForm; relatedProductIds: string[] } | null {
  if (!snapshot.trim()) {
    return null
  }

  try {
    const parsed = JSON.parse(snapshot) as {
      form?: AdminProductDetailForm
      relatedProductIds?: string[]
    }

    if (!parsed.form) {
      return null
    }

    return {
      form: parsed.form,
      relatedProductIds: Array.isArray(parsed.relatedProductIds) ? parsed.relatedProductIds : [],
    }
  } catch {
    return null
  }
}

function omitDescriptionFields(form: AdminProductDetailForm): Omit<
  AdminProductDetailForm,
  DescriptionFieldKey
> {
  const { description: _description, detail_media: _detailMedia, short_description: _shortDescription, ...rest } =
    form
  return rest
}

function pickDescriptionFields(
  form: AdminProductDetailForm,
): Pick<AdminProductDetailForm, DescriptionFieldKey> {
  return {
    description: form.description,
    detail_media: form.detail_media,
    short_description: form.short_description,
  }
}

/** True when only description-related fields changed since last save. */
export function isDescriptionOnlySave(
  nextForm: AdminProductDetailForm,
  savedSnapshot: string,
  relatedProducts: RelatedProductPick[],
): boolean {
  const saved = parseEditorState(savedSnapshot)
  if (!saved) {
    return false
  }

  const nextRelatedIds = relatedProducts.map((item) => item.id).sort()
  const savedRelatedIds = [...saved.relatedProductIds].sort()
  if (JSON.stringify(nextRelatedIds) !== JSON.stringify(savedRelatedIds)) {
    return false
  }

  const nextCanonical = canonicalizeFormForSnapshot(nextForm)
  const savedCanonical = canonicalizeFormForSnapshot(saved.form)

  if (
    JSON.stringify(omitDescriptionFields(nextCanonical)) !==
    JSON.stringify(omitDescriptionFields(savedCanonical))
  ) {
    return false
  }

  return (
    JSON.stringify(pickDescriptionFields(nextCanonical)) !==
    JSON.stringify(pickDescriptionFields(savedCanonical))
  )
}

export interface ProductEditorDebugState {
  isDirty: boolean
  isSaving: boolean
  savedSnapshot: string
  form: AdminProductDetailForm
  variantStockDraft: Record<string, string>
  pricingDraft: AdminPricingNumericDraft
  disabledReason?: string | null
  updatePayload?: Record<string, unknown>
  updateResult?: unknown
}

export function logProductEditorDebugState(input: ProductEditorDebugState): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.group('[product-editor] options state')
  console.log('isDirty', input.isDirty)
  console.log('isSaving', input.isSaving)
  console.log('savedSnapshot', input.savedSnapshot)
  console.log('current form', canonicalizeFormForSnapshot(input.form))
  console.log('variants', input.form.variants)
  console.log('optionGroups', input.form.optionGroups)
  console.log('variantStockDraftRef', input.variantStockDraft)
  console.log('pricingDraftRef', input.pricingDraft)
  console.log('products.stock', input.form.stock)
  console.log('status', input.form.status)
  console.log('disabled reason', input.disabledReason ?? null)
  if (input.updatePayload) {
    console.log('update payload', input.updatePayload)
  }
  if (input.updateResult) {
    console.log('Supabase update result', input.updateResult)
  }
  console.groupEnd()
}
