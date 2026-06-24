import { describe, expect, it } from 'vitest'
import { calculateCustomerGrade } from './calculateCustomerGrade'

describe('calculateCustomerGrade', () => {
  it('returns regular below 300,000', () => {
    expect(calculateCustomerGrade(0)).toBe('regular')
    expect(calculateCustomerGrade(299_999)).toBe('regular')
  })

  it('returns loyal at 300,000 or above', () => {
    expect(calculateCustomerGrade(300_000)).toBe('loyal')
    expect(calculateCustomerGrade(499_999)).toBe('loyal')
  })

  it('returns vip at 500,000 or above', () => {
    expect(calculateCustomerGrade(500_000)).toBe('vip')
    expect(calculateCustomerGrade(1_000_000)).toBe('vip')
  })
})
