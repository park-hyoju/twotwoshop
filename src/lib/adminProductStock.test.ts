import { describe, expect, it } from 'vitest'
import { getAdminProductTotalStock, getAdminStockDisplayStatus } from './adminProductStock'

describe('adminProductStock', () => {
  it('sums option stocks when variants exist', () => {
    const productInfo = {
      variants: [
        { id: 'v1', color: '진청', size: '55', stock: 10 },
        { id: 'v2', color: '진청', size: '66', stock: 5 },
        { id: 'v3', color: '흑청', size: '55', stock: 3 },
      ],
    }

    expect(getAdminProductTotalStock(99, productInfo)).toBe(18)
  })

  it('uses base stock when no variants exist', () => {
    expect(getAdminProductTotalStock(42, {})).toBe(42)
    expect(getAdminProductTotalStock(42, { variants: [] })).toBe(42)
  })

  it('returns stock display status for admin list', () => {
    expect(getAdminStockDisplayStatus(0)).toBe('soldout')
    expect(getAdminStockDisplayStatus(3)).toBe('low')
    expect(getAdminStockDisplayStatus(5)).toBe('low')
    expect(getAdminStockDisplayStatus(6)).toBe('normal')
  })
})
