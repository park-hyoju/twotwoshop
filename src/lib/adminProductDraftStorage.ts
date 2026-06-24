import type { AdminProductDetailForm } from '../types/adminProductDetail'

const DRAFT_KEY_PREFIX = 'twotwoshop-product-draft:'

function getDraftKey(productId: string): string {
  return `${DRAFT_KEY_PREFIX}${productId}`
}

export function saveProductDraft(productId: string, form: AdminProductDetailForm): void {
  try {
    localStorage.setItem(getDraftKey(productId), JSON.stringify(form))
  } catch {
    // ignore quota errors
  }
}

export function loadProductDraft(productId: string): AdminProductDetailForm | null {
  try {
    const raw = localStorage.getItem(getDraftKey(productId))
    if (!raw) {
      return null
    }

    return JSON.parse(raw) as AdminProductDetailForm
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
