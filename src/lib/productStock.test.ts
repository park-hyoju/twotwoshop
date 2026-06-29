import { describe, expect, it } from 'vitest'
import {
  getCustomerStockLabel,
  getCustomerStockStatus,
  isProductPurchasable,
  isProductSoldOut,
} from './productStock'

describe('productStock', () => {
  it('returns soldout when stock is zero or negative', () => {
    expect(getCustomerStockStatus(0)).toBe('soldout')
    expect(getCustomerStockStatus(-1)).toBe('soldout')
    expect(getCustomerStockLabel(0)).toBe('품절')
    expect(isProductSoldOut({ stock: 0 })).toBe(true)
    expect(isProductPurchasable({ stock: 0 })).toBe(false)
  })

  it('returns low stock label without exposing quantity', () => {
    expect(getCustomerStockStatus(1)).toBe('low')
    expect(getCustomerStockStatus(2)).toBe('low')
    expect(getCustomerStockLabel(2)).toBe('품절 임박')
    expect(getCustomerStockLabel(2)).not.toContain('2')
  })

  it('returns available for stock above two without label', () => {
    expect(getCustomerStockStatus(3)).toBe('available')
    expect(getCustomerStockLabel(3)).toBeNull()
    expect(isProductPurchasable({ stock: 3, status: 'active' })).toBe(true)
  })
})
