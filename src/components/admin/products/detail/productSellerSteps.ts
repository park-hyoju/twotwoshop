import type { ProductSellerStep } from '../../../../types/adminProductDetail'

export const PRODUCT_SELLER_STEPS: Array<{ id: ProductSellerStep; step: number; label: string }> = [
  { id: 'photos', step: 1, label: '상품 사진' },
  { id: 'info', step: 2, label: '상품 정보' },
  { id: 'options', step: 3, label: '옵션' },
  { id: 'description', step: 4, label: '상세페이지' },
  { id: 'shipping', step: 5, label: '배송' },
]

export function getSellerStepIndex(step: ProductSellerStep): number {
  return PRODUCT_SELLER_STEPS.findIndex((item) => item.id === step)
}
