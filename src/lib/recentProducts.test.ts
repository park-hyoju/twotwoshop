import { describe, expect, it, beforeEach } from 'vitest'
import {
  addRecentProduct,
  clearRecentProducts,
  getRecentProducts,
  removeRecentProduct,
} from './recentProducts'

describe('recentProducts', () => {
  beforeEach(() => {
    clearRecentProducts()
  })

  it('stores and retrieves recent products', () => {
    addRecentProduct({
      slug: 'test-product',
      name: 'Test Product',
      thumbnail: '/img.jpg',
      price: 12000,
    })

    const items = getRecentProducts()
    expect(items).toHaveLength(1)
    expect(items[0]?.slug).toBe('test-product')
  })

  it('moves duplicate product to the front', () => {
    addRecentProduct({
      slug: 'a',
      name: 'A',
      thumbnail: '/a.jpg',
      price: 1000,
    })
    addRecentProduct({
      slug: 'b',
      name: 'B',
      thumbnail: '/b.jpg',
      price: 2000,
    })
    addRecentProduct({
      slug: 'a',
      name: 'A',
      thumbnail: '/a.jpg',
      price: 1000,
    })

    expect(getRecentProducts().map((item) => item.slug)).toEqual(['a', 'b'])
  })

  it('removes a product from storage', () => {
    addRecentProduct({
      slug: 'remove-me',
      name: 'Remove',
      thumbnail: '/r.jpg',
      price: 3000,
    })

    removeRecentProduct('remove-me')
    expect(getRecentProducts()).toHaveLength(0)
  })
})
