import { parseProductVariants } from './productVariants'

export type AdminStockDisplayStatus = 'soldout' | 'low' | 'normal'

export function getAdminProductTotalStock(stock: number, productInfo: unknown): number {
  const variants = parseProductVariants(productInfo)

  if (variants.length === 0) {
    return Math.max(0, stock)
  }

  return variants.reduce((sum, variant) => sum + variant.stock, 0)
}

export function getAdminStockDisplayStatus(totalStock: number): AdminStockDisplayStatus {
  if (totalStock <= 0) {
    return 'soldout'
  }

  if (totalStock <= 5) {
    return 'low'
  }

  return 'normal'
}
