import { describe, expect, it } from 'vitest'
import { generateProductSlugFromName } from './productSlug'

describe('generateProductSlugFromName', () => {
  it('romanizes Korean product names into URL-safe slugs', () => {
    const slug = generateProductSlugFromName('린넨 셔츠')
    expect(slug).toMatch(/^[a-z0-9-]+$/)
    expect(slug.length).toBeGreaterThan(0)
  })

  it('handles English names', () => {
    expect(generateProductSlugFromName('Classic Linen Shirt')).toBe('classic-linen-shirt')
  })

  it('returns empty string for blank names', () => {
    expect(generateProductSlugFromName('   ')).toBe('')
  })

  it('falls back when slug would be too short', () => {
    const slug = generateProductSlugFromName('a')
    expect(slug.startsWith('product-')).toBe(true)
  })
})
