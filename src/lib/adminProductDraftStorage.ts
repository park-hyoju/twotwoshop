import { createEmptyProductDetailForm } from './adminProductDetailDefaults'
import type { AdminProductDetailForm, AdminProductVariant } from '../types/adminProductDetail'
import type { RelatedProductPick } from '../types/adminProductRelated'

const DRAFT_KEY_PREFIX = 'twotwoshop-product-draft:'

export interface ProductEditorDraft {
  form: AdminProductDetailForm
  relatedProducts: RelatedProductPick[]
}

function getDraftKey(productId: string): string {
  return `${DRAFT_KEY_PREFIX}${productId}`
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

export function saveProductDraft(
  productId: string,
  form: AdminProductDetailForm,
  relatedProducts: RelatedProductPick[] = [],
): void {
  try {
    const draft: ProductEditorDraft = {
      form: normalizeProductDetailForm(productId, form),
      relatedProducts,
    }
    localStorage.setItem(getDraftKey(productId), JSON.stringify(draft))
  } catch {
    // ignore quota errors
  }
}

export function loadProductDraft(productId: string): ProductEditorDraft | null {
  try {
    const raw = localStorage.getItem(getDraftKey(productId))
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<ProductEditorDraft> & Partial<AdminProductDetailForm>

    if (parsed.form && typeof parsed.form === 'object') {
      return {
        form: normalizeProductDetailForm(productId, parsed.form as Partial<AdminProductDetailForm>),
        relatedProducts: Array.isArray(parsed.relatedProducts) ? parsed.relatedProducts : [],
      }
    }

    return {
      form: normalizeProductDetailForm(productId, parsed as Partial<AdminProductDetailForm>),
      relatedProducts: [],
    }
  } catch {
    return null
  }
}

export function clearProductDraft(productId: string): void {
  try {
    localStorage.removeItem(getDraftKey(productId))
  } catch {
    // ignore
  }
}
