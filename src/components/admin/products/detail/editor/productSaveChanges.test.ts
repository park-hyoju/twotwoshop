import { describe, expect, it } from 'vitest'
import { createEmptyProductDetailForm } from '../../../../../lib/adminProductDetailDefaults'
import {
  detectAdminProductDetailChanges,
  isDescriptionOnlyChanges,
} from './productSaveChanges'

describe('detectAdminProductDetailChanges', () => {
  const baseline = {
    ...createEmptyProductDetailForm('p1'),
    name: '상품',
    slug: 'product',
    price: 10_000,
    original_price: 12_000,
    discount_rate: 17,
    stock: 8,
    status: 'active' as const,
    description: '기존',
    variants: [
      {
        id: 'v1',
        options: { 색상: '블랙' },
        stock: 8,
        extraPrice: 0,
        sku: '',
        color: '블랙',
        size: '',
      },
    ],
  }

  it('detects description-only changes', () => {
    const next = { ...baseline, description: '수정' }
    const changes = detectAdminProductDetailChanges(baseline, next, [], [])

    expect(isDescriptionOnlyChanges(changes)).toBe(true)
  })

  it('detects pricing changes without touching options', () => {
    const next = { ...baseline, price: 12_000 }
    const changes = detectAdminProductDetailChanges(baseline, next, [], [])

    expect(changes.pricing).toBe(true)
    expect(changes.options).toBe(false)
    expect(changes.status).toBe(false)
  })

  it('detects option stock changes', () => {
    const next = {
      ...baseline,
      variants: [{ ...baseline.variants[0], stock: 3 }],
      stock: 3,
    }
    const changes = detectAdminProductDetailChanges(baseline, next, [], [])

    expect(changes.options).toBe(true)
    expect(changes.pricing).toBe(false)
  })

  it('does not treat regenerated variant ids as option changes', () => {
    const next = {
      ...baseline,
      variants: [{ ...baseline.variants[0], id: 'v-regenerated' }],
    }
    const changes = detectAdminProductDetailChanges(baseline, next, [], [])

    expect(changes.options).toBe(false)
  })

  it('detects detail media order changes without description text changes', () => {
    const item = (url: string, order: number) => ({
      type: 'image' as const,
      url,
      order,
      filename: `${order}.jpg`,
      thumbnail: null,
      duration: null,
      width: null,
      height: null,
    })

    const withMedia = {
      ...baseline,
      detail_media: [item('https://example.com/1.jpg', 0), item('https://example.com/2.jpg', 1)],
    }
    const reordered = {
      ...withMedia,
      detail_media: [item('https://example.com/2.jpg', 0), item('https://example.com/1.jpg', 1)],
    }

    const changes = detectAdminProductDetailChanges(withMedia, reordered, [], [])

    expect(changes.description).toBe(false)
    expect(changes.detailMedia).toBe(true)
    expect(isDescriptionOnlyChanges(changes)).toBe(true)
  })
})
