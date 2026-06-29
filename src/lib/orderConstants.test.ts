import { describe, expect, it } from 'vitest'
import { SHIPPING_FEE, calculateOrderTotal } from './orderConstants'

describe('orderConstants', () => {
  it('defines flat shipping fee as 4000', () => {
    expect(SHIPPING_FEE).toBe(4000)
  })

  it('calculates order total as product amount plus shipping fee', () => {
    expect(calculateOrderTotal(24000)).toBe(28000)
    expect(calculateOrderTotal(0)).toBe(4000)
  })
})
