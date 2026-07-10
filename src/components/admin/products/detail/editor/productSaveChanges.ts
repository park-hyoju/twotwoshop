import {
  buildVariantsFromOptionGroups,
  getVariantOptionKey,
  getVariantTotalStock,
  normalizeOptionGroupsInput,
  resolveVariantStocksFromDraft,
} from '../../../../../lib/adminProductOptions'
import type { AdminProductDetailForm, AdminProductOptionGroup, AdminProductVariant } from '../../../../../types/adminProductDetail'
import type { ProductStatus } from '../../../../../types/status'
import type { DetailMediaItem } from '../../../../../types/detailMedia'
import { reindexDetailMediaByArrayOrder } from '../../../../../lib/detailMedia'

export interface AdminProductDetailChangeSet {
  description: boolean
  detailMedia: boolean
  pricing: boolean
  options: boolean
  simpleStock: boolean
  basicInfo: boolean
  status: boolean
  media: boolean
  shipping: boolean
  exposure: boolean
  related: boolean
}

function serializeVariants(variants: AdminProductVariant[]): string {
  return JSON.stringify(
    [...variants]
      .map((variant) => ({
        key: getVariantOptionKey(variant.options ?? {}),
        stock: variant.stock,
        extraPrice: variant.extraPrice,
        sku: variant.sku,
      }))
      .sort((left, right) => left.key.localeCompare(right.key, 'ko')),
  )
}

function serializeOptionGroupsForChangeDetection(groups: AdminProductOptionGroup[]): string {
  return JSON.stringify(
    normalizeOptionGroupsInput(groups).map((group) => ({
      name: group.name.trim(),
      valuesInput: group.valuesInput.trim(),
    })),
  )
}

function pickDescriptionFields(form: AdminProductDetailForm) {
  return {
    description: form.description,
  }
}

function serializeDetailMedia(items: DetailMediaItem[]): string {
  return JSON.stringify(
    reindexDetailMediaByArrayOrder(items).map((item) => ({
      url: item.url,
      type: item.type,
      order: item.order,
    })),
  )
}

export function detectAdminProductDetailChanges(
  baseline: AdminProductDetailForm,
  next: AdminProductDetailForm,
  baselineRelatedIds: string[],
  nextRelatedIds: string[],
): AdminProductDetailChangeSet {
  const hasVariants = next.variants.length > 0

  return {
    description:
      JSON.stringify(pickDescriptionFields(baseline)) !==
      JSON.stringify(pickDescriptionFields(next)),
    detailMedia:
      serializeDetailMedia(baseline.detail_media) !== serializeDetailMedia(next.detail_media),
    pricing:
      baseline.price !== next.price ||
      baseline.original_price !== next.original_price ||
      baseline.discount_rate !== next.discount_rate,
    options:
      serializeOptionGroupsForChangeDetection(baseline.optionGroups) !==
        serializeOptionGroupsForChangeDetection(next.optionGroups) ||
      serializeVariants(baseline.variants) !== serializeVariants(next.variants),
    simpleStock: !hasVariants && baseline.stock !== next.stock,
    basicInfo:
      baseline.name !== next.name ||
      baseline.slug !== next.slug ||
      baseline.brand !== next.brand ||
      baseline.sku !== next.sku ||
      baseline.product_category !== next.product_category,
    status: baseline.status !== next.status,
    media:
      baseline.thumbnail !== next.thumbnail ||
      JSON.stringify(baseline.images) !== JSON.stringify(next.images),
    shipping:
      JSON.stringify(baseline.shipping_info) !== JSON.stringify(next.shipping_info) ||
      JSON.stringify(baseline.return_info) !== JSON.stringify(next.return_info) ||
      JSON.stringify(baseline.size_guide) !== JSON.stringify(next.size_guide),
    exposure:
      baseline.isNew !== next.isNew ||
      baseline.isBest !== next.isBest ||
      baseline.isSale !== next.isSale,
    related:
      JSON.stringify([...baselineRelatedIds].sort()) !==
      JSON.stringify([...nextRelatedIds].sort()),
  }
}

export function hasNonDescriptionChanges(changes: AdminProductDetailChangeSet): boolean {
  return (
    changes.pricing ||
    changes.options ||
    changes.simpleStock ||
    changes.basicInfo ||
    changes.status ||
    changes.media ||
    changes.shipping ||
    changes.exposure ||
    changes.related
  )
}

export function isDescriptionOnlyChanges(changes: AdminProductDetailChangeSet): boolean {
  return (changes.description || changes.detailMedia) && !hasNonDescriptionChanges(changes)
}

export function hasPersistableChanges(changes: AdminProductDetailChangeSet): boolean {
  return Object.values(changes).some(Boolean)
}

export function summarizeVariantStock(form: AdminProductDetailForm): AdminProductDetailForm {
  if (form.variants.length === 0) {
    return form
  }

  return {
    ...form,
    stock: getVariantTotalStock(form.variants),
  }
}

/** 저장 직전 옵션 form을 정규화합니다. draft 병합 → variants 재생성 → stock 합산. */
export function prepareOptionsFormForSave(
  form: AdminProductDetailForm,
  draft: Record<string, string>,
): AdminProductDetailForm {
  const optionGroups = normalizeOptionGroupsInput(form.optionGroups)
  if (optionGroups.length === 0) {
    return form.variants.length > 0
      ? summarizeVariantStock({ ...form, variants: [], optionGroups: [], stock: 0 })
      : { ...form, optionGroups: [] }
  }

  const withDraft =
    form.variants.length > 0 ? mergeVariantStockDraftIntoForm(form, draft) : { ...form, optionGroups }

  const stockByVariantId = Object.fromEntries(
    withDraft.variants.map((row) => [row.id, row.stock]),
  )
  const variants = buildVariantsFromOptionGroups(
    withDraft.optionGroups,
    withDraft.variants,
    stockByVariantId,
  )

  return summarizeVariantStock({
    ...withDraft,
    optionGroups,
    variants,
  })
}

/** 옵션 재고 draft를 form.variants에 반영합니다. 저장 직전 change detection에도 사용합니다. */
export function mergeVariantStockDraftIntoForm(
  form: AdminProductDetailForm,
  draft: Record<string, string>,
): AdminProductDetailForm {
  if (form.variants.length === 0) {
    return form
  }

  return summarizeVariantStock({
    ...form,
    variants: resolveVariantStocksFromDraft(form.variants, draft),
  })
}

/** 재고가 있는데 품절 상태면 판매중 전환 여부를 확인합니다. hidden은 유지합니다. */
export function resolveSoldoutStatusWhenStockAvailable(
  form: AdminProductDetailForm,
  confirm: (message: string) => boolean = (message) => window.confirm(message),
): AdminProductDetailForm {
  if (form.variants.length === 0 || form.status !== 'soldout') {
    return form
  }

  const totalStock = getVariantTotalStock(form.variants)
  if (totalStock <= 0) {
    return form
  }

  if (confirm('재고가 있습니다. 판매중으로 변경할까요?')) {
    return { ...form, status: 'active' as ProductStatus }
  }

  return form
}

export interface AdminOptionStockSaveDebugInput {
  productId: string
  optionStockDraft: Record<string, string>
  formVariantsStock: number[]
  finalVariantsStock: number[]
  totalStock: number
  currentStatus: ProductStatus
  updatePayload?: Record<string, unknown>
  updateResult?: {
    stock: number
    status: ProductStatus
    variantStocks: number[]
  }
}

export function logAdminOptionStockSaveDebug(input: AdminOptionStockSaveDebugInput): void {
  if (!import.meta.env.DEV) {
    return
  }

  const payload = input.updatePayload
  const productInfo = payload?.product_info as { variants?: Array<{ stock?: number }> } | undefined

  console.log('productId', input.productId)
  console.log('option stock draft', input.optionStockDraft)
  console.log('form variants stock', input.formVariantsStock)
  console.log('final variants stock', input.finalVariantsStock)
  console.log('total stock', input.totalStock)
  console.log('current status', input.currentStatus)
  console.log('update payload keys', payload ? Object.keys(payload) : [])
  console.log(
    'product_info.variants stock list',
    productInfo?.variants?.map((variant) => variant.stock ?? 0) ?? [],
  )
  if (input.updateResult) {
    console.log('Supabase update result', input.updateResult)
  }
}
