import { isPlaceholderProductImage } from '../../../../../lib/productImageStorage'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import { hasDetailImages } from '../detailContent/detailContent'

export type ProductEditorSectionId = 'photos' | 'name' | 'pricing' | 'details'

export interface ProductEditorSection {
  id: ProductEditorSectionId
  step: number
  label: string
}

export const PRODUCT_EDITOR_SECTIONS: ProductEditorSection[] = [
  { id: 'photos', step: 1, label: '상품 사진' },
  { id: 'name', step: 2, label: '상품명' },
  { id: 'pricing', step: 3, label: '가격/재고' },
  { id: 'details', step: 4, label: '상세 이미지' },
]

export function isSectionComplete(
  sectionId: ProductEditorSectionId,
  form: AdminProductDetailForm,
): boolean {
  switch (sectionId) {
    case 'photos':
      return Boolean(form.thumbnail) && !isPlaceholderProductImage(form.thumbnail)
    case 'name':
      return form.name.trim().length > 0
    case 'pricing':
      return form.price > 0
    case 'details':
      return hasDetailImages(form)
    default:
      return false
  }
}

export function serializeFormForDirtyCheck(form: AdminProductDetailForm): string {
  return JSON.stringify(form)
}
