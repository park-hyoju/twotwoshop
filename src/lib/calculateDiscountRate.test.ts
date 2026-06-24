import { describe, expect, it } from 'vitest'
import {
  calculateDiscountRate,
  calculateDiscountRateForStorage,
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
})
