import type { ProductDetailEditorTab } from '../../../../types/adminProductDetail'

export const PRODUCT_DETAIL_TABS: Array<{ id: ProductDetailEditorTab; label: string }> = [
  { id: 'basic', label: '기본정보' },
  { id: 'images', label: '이미지' },
  { id: 'description', label: '상세설명' },
  { id: 'size', label: '사이즈' },
  { id: 'info', label: '상품정보' },
  { id: 'shipping', label: '배송' },
  { id: 'seo', label: 'SEO' },
  { id: 'preview', label: '미리보기' },
]
