import { isPlaceholderProductImage } from '../../../../../lib/productImageStorage'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'

export type ProductEditorSectionId =
  | 'photos'
  | 'info'
  | 'pricing'
  | 'description'
  | 'shipping'
  | 'preview'

export interface ProductEditorSection {
  id: ProductEditorSectionId
  step: number
  label: string
}

export const PRODUCT_EDITOR_SECTIONS: ProductEditorSection[] = [
  { id: 'photos', step: 1, label: '상품사진' },
  { id: 'info', step: 2, label: '상품정보' },
  { id: 'pricing', step: 3, label: '가격/재고' },
  { id: 'description', step: 4, label: '상세설명' },
  { id: 'shipping', step: 5, label: '배송/교환' },
  { id: 'preview', step: 6, label: '미리보기' },
]

export function isSectionComplete(
  sectionId: ProductEditorSectionId,
  form: AdminProductDetailForm,
): boolean {
  switch (sectionId) {
    case 'photos':
      return (
        (Boolean(form.thumbnail) && !isPlaceholderProductImage(form.thumbnail)) ||
        form.images.some((url) => url.trim() && !isPlaceholderProductImage(url))
      )
    case 'info':
      return form.name.trim().length > 0
    case 'pricing':
      return form.price > 0
    case 'description':
      return (
        form.short_description.trim().length > 0 ||
        form.description.trim().length > 0 ||
        form.images.some((url) => url.trim() && !isPlaceholderProductImage(url))
      )
    case 'shipping':
      return (
        Object.values(form.shipping_info).some((value) => value.trim()) ||
        Object.values(form.return_info).some((value) => value.trim())
      )
    case 'preview':
      return true
    default:
      return false
  }
}

export function serializeFormForDirtyCheck(form: AdminProductDetailForm): string {
  return JSON.stringify(form)
}
