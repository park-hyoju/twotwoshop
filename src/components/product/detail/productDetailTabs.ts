export type ProductDetailTab = 'info' | 'shipping' | 'return'

export const PRODUCT_DETAIL_TABS: Array<{ id: ProductDetailTab; label: string }> = [
  { id: 'info', label: '상세정보' },
  { id: 'shipping', label: '배송안내' },
  { id: 'return', label: '교환/반품' },
]
