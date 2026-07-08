export type CustomerStockStatus = 'available' | 'low' | 'soldout'

export function getCustomerStockStatus(stock: number): CustomerStockStatus {
  if (stock <= 0) {
    return 'soldout'
  }

  if (stock <= 2) {
    return 'low'
  }

  return 'available'
}

export function isProductPurchasable(product: {
  stock: number
  status?: string
}): boolean {
  if (product.status === 'hidden') {
    return false
  }

  return product.stock > 0
}

export function isProductSoldOut(product: { stock: number }): boolean {
  return product.stock <= 0
}

/** 고객 화면용 재고 상태 라벨. 수량은 노출하지 않고 품절만 표시합니다. */
export function getCustomerStockLabel(stock: number): string | null {
  if (stock <= 0) {
    return '품절'
  }

  return null
}

export function getCustomerStockBadgeClassName(stock: number): string {
  const status = getCustomerStockStatus(stock)

  if (status === 'soldout') {
    return 'bg-neutral-800 text-white'
  }

  if (status === 'low') {
    return 'bg-amber-500 text-white'
  }

  return 'bg-emerald-600 text-white'
}

export const INSUFFICIENT_STOCK_ORDER_MESSAGE = '현재 구매 가능한 수량을 초과했습니다.'
