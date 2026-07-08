import { describe, expect, it } from 'vitest'
import {
  calculateDiscountRate,
  calculateDiscountRateForStorage,
  calculateSalePriceFromDiscount,
} from './calculateDiscountRate'

describe('calculateDiscountRate', () => {
  it('returns 19% for original 48,000 and sale 39,000', () => {
    expect(calculateDiscountRate(48000, 39000)).toBe(19)
    expect(calculateDiscountRateForStorage(48000, 39000)).toBe(19)
  })

  it('returns null when original equals sale price', () => {
    expect(calculateDiscountRate(39000, 39000)).toBeNull()
    expect(calculateDiscountRateForStorage(39000, 39000)).toBe(0)
  })

  it('returns null when original price is missing or invalid', () => {
    expect(calculateDiscountRate(0, 39000)).toBeNull()
    expect(calculateDiscountRate(-100, 39000)).toBeNull()
    expect(calculateDiscountRateForStorage(0, 39000)).toBe(0)
  })

  it('returns null when sale price is higher than original', () => {
    expect(calculateDiscountRate(39000, 48000)).toBeNull()
  })

  it('returns 34% for original 89,000 and sale 59,000', () => {
    expect(calculateDiscountRate(89000, 59000)).toBe(34)
    expect(calculateDiscountRateForStorage(89000, 59000)).toBe(34)
  })
})

describe('calculateSalePriceFromDiscount', () => {
  it('derives sale price from original and discount percent', () => {
    expect(calculateSalePriceFromDiscount(89000, 34)).toBe(58740)
    expect(calculateSalePriceFromDiscount(48000, 19)).toBe(38880)
  })

  it('returns original price when discount is zero or invalid', () => {
    expect(calculateSalePriceFromDiscount(89000, 0)).toBe(89000)
    expect(calculateSalePriceFromDiscount(0, 20)).toBe(0)
  })
})
