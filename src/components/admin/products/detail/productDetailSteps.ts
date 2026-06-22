export type ProductDetailEditorStep =
  | 'basic'
  | 'images'
  | 'description'
  | 'pricing'
  | 'shipping'
  | 'preview'
  | 'advanced'

export const PRODUCT_DETAIL_STEPS: Array<{
  id: ProductDetailEditorStep
  step: number
  label: string
}> = [
  { id: 'basic', step: 1, label: '기본정보' },
  { id: 'images', step: 2, label: '상품사진' },
  { id: 'description', step: 3, label: '상품설명' },
  { id: 'pricing', step: 4, label: '가격/재고' },
  { id: 'shipping', step: 5, label: '배송/교환' },
  { id: 'preview', step: 6, label: '미리보기' },
  { id: 'advanced', step: 7, label: '고급설정' },
]
