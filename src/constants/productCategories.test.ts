import { describe, expect, it } from 'vitest'
import { resolveProductCategory, syncLegacyCategoryFields } from '../constants/productCategories'

describe('productCategories', () => {
  it('resolves legacy women top category', () => {
    expect(
      resolveProductCategory({
        gender: 'women',
        display_category: 'top',
      }),
    ).toBe('women_top')
  })

  it('prefers product_category column when present', () => {
    expect(
      resolveProductCategory({
        product_category: 'perfume',
        gender: 'women',
        display_category: 'top',
      }),
    ).toBe('perfume')
  })

  it('syncs legacy fields from unified category id', () => {
    expect(syncLegacyCategoryFields('women_outer')).toEqual({
      gender: 'women',
      display_category: 'top',
      detail_category: 'hoodie',
      product_category: 'women_outer',
    })
  })
})
