import { getVariantOptionKey, getVariantTotalStock, normalizeOptionGroupsInput } from '../../../../../lib/adminProductOptions'
import type { AdminProductDetailForm, AdminProductOptionGroup, AdminProductVariant } from '../../../../../types/adminProductDetail'
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

function serializeOptionGroups(groups: AdminProductOptionGroup[]): string {
  return JSON.stringify(
    normalizeOptionGroupsInput(groups).map((group) => ({
      name: group.name.trim(),
      valuesInput: group.valuesInput.trim(),
    })),
  )
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
      serializeOptionGroups(baseline.optionGroups) !== serializeOptionGroups(next.optionGroups) ||
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
