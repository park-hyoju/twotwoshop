import { describe, expect, it } from 'vitest'
import {
  getCustomerStockLabel,
  getCustomerStockStatus,
  isProductPurchasable,
  isProductSoldOut,
} from './productStock'

describe('productStock', () => {
  it('returns soldout label only when stock is zero or negative', () => {
    expect(getCustomerStockStatus(0)).toBe('soldout')
    expect(getCustomerStockStatus(-1)).toBe('soldout')
    expect(getCustomerStockLabel(0)).toBe('품절')
    expect(isProductSoldOut({ stock: 0 })).toBe(true)
    expect(isProductPurchasable({ stock: 0 })).toBe(false)
  })

  it('does not expose stock quantity or low-stock labels to customers', () => {
    expect(getCustomerStockStatus(1)).toBe('low')
    expect(getCustomerStockStatus(2)).toBe('low')
    expect(getCustomerStockLabel(1)).toBeNull()
    expect(getCustomerStockLabel(2)).toBeNull()
    expect(getCustomerStockLabel(10)).toBeNull()
  })

  it('returns no label for purchasable stock', () => {
    expect(getCustomerStockStatus(3)).toBe('available')
    expect(getCustomerStockLabel(3)).toBeNull()
    expect(isProductPurchasable({ stock: 3, status: 'active' })).toBe(true)
  })
})
