import { describe, expect, it } from 'vitest'
import { createEmptyProductDetailForm } from '../../../../../lib/adminProductDetailDefaults'
import {
  detectAdminProductDetailChanges,
  isDescriptionOnlyChanges,
  mergeVariantStockDraftIntoForm,
  prepareOptionsFormForSave,
  resolveSoldoutStatusWhenStockAvailable,
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

  it('detects stock-only edits after merging variant stock draft', () => {
    const baselineForm = {
      ...createEmptyProductDetailForm('p1'),
      stock: 0,
      status: 'soldout' as const,
      optionGroups: [
        { id: 'g1', name: '색상', valuesInput: '네이비, 화이트' },
        { id: 'g2', name: '사이즈', valuesInput: '95, 100, 105' },
      ],
      variants: [
        {
          id: 'v-navy-95',
          options: { 색상: '네이비', 사이즈: '95' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '네이비',
          size: '95',
        },
        {
          id: 'v-navy-100',
          options: { 색상: '네이비', 사이즈: '100' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '네이비',
          size: '100',
        },
        {
          id: 'v-white-95',
          options: { 색상: '화이트', 사이즈: '95' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '화이트',
          size: '95',
        },
      ],
    }
    const draft = {
      'v-navy-95': '3',
      'v-navy-100': '4',
      'v-white-95': '5',
    }
    const merged = mergeVariantStockDraftIntoForm(baselineForm, draft)
    const changes = detectAdminProductDetailChanges(baselineForm, merged, [], [])

    expect(merged.variants.map((row) => row.stock)).toEqual([3, 4, 5])
    expect(merged.stock).toBe(12)
    expect(changes.options).toBe(true)
    expect(changes.description).toBe(false)
    expect(changes.pricing).toBe(false)
  })

  it('offers active status when stock exists while soldout', () => {
    const form = {
      ...createEmptyProductDetailForm('p1'),
      status: 'soldout' as const,
      stock: 12,
      variants: [
        {
          id: 'v1',
          options: { 색상: '네이비', 사이즈: '95' },
          stock: 12,
          extraPrice: 0,
          sku: '',
          color: '네이비',
          size: '95',
        },
      ],
    }

    const confirmed = resolveSoldoutStatusWhenStockAvailable(form, () => true)
    const declined = resolveSoldoutStatusWhenStockAvailable(form, () => false)
    const hidden = resolveSoldoutStatusWhenStockAvailable(
      { ...form, status: 'hidden' },
      () => true,
    )

    expect(confirmed.status).toBe('active')
    expect(declined.status).toBe('soldout')
    expect(hidden.status).toBe('hidden')
  })

  it('does not treat regenerated variant ids as option changes', () => {
    const next = {
      ...baseline,
      variants: [{ ...baseline.variants[0], id: 'v-regenerated' }],
    }
    const changes = detectAdminProductDetailChanges(baseline, next, [], [])

    expect(changes.options).toBe(false)
  })

  it('rebuilds six variants from color and size groups', () => {
    const form = {
      ...createEmptyProductDetailForm('p1'),
      optionGroups: [
        { id: 'g1', name: '색상', valuesInput: '네이비, 화이트' },
        { id: 'g2', name: '사이즈', valuesInput: '95, 100, 105' },
      ],
      variants: [],
      stock: 0,
    }
    const draft = {}

    const prepared = prepareOptionsFormForSave(form, draft)

    expect(prepared.variants).toHaveLength(6)
    expect(prepared.stock).toBe(0)
    expect(
      prepared.variants.map((variant) => `${variant.options.색상}/${variant.options.사이즈}`),
    ).toEqual([
      '네이비/95',
      '네이비/100',
      '네이비/105',
      '화이트/95',
      '화이트/100',
      '화이트/105',
    ])
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
