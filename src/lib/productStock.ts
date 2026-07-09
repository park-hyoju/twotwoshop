import type { ProductVariant } from '../types/product'
import { hasProductOptions } from './productVariants'

export type CustomerStockStatus = 'available' | 'low' | 'soldout'

export function getProductTotalStock(product: {
  stock: number
  variants?: ProductVariant[]
}): number {
  if (hasProductOptions({ variants: product.variants ?? [] })) {
    return (product.variants ?? []).reduce(
      (sum, variant) => sum + Math.max(0, variant.stock ?? 0),
      0,
    )
  }

  const stock = product.stock ?? 0
  return Number.isFinite(stock) ? Math.max(0, stock) : 0
}

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
  variants?: ProductVariant[]
}): boolean {
  if (product.status === 'hidden' || product.status === 'soldout') {
    return false
  }

  return getProductTotalStock(product) > 0
}

export function isProductSoldOut(product: {
  stock: number
  status?: string
  variants?: ProductVariant[]
}): boolean {
  if (product.status === 'soldout') {
    return true
  }

  return getProductTotalStock(product) === 0
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
