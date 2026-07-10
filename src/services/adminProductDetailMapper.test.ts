import { describe, expect, it } from 'vitest'
import { createEmptyProductDetailForm } from '../lib/adminProductDetailDefaults'
import {
  buildAdminProductDetailPartialUpdatePayload,
  mapAdminProductDetailFormToDescriptionUpdatePayload,
  mapAdminProductDetailFormToUpdatePayload,
} from './adminProductDetailMapper'

describe('mapAdminProductDetailFormToDescriptionUpdatePayload', () => {
  it('includes only description-related fields', () => {
    const form = {
      ...createEmptyProductDetailForm('p1'),
      description: '상세 본문',
      short_description: '짧은 소개',
      status: 'soldout' as const,
      stock: 0,
      price: 9900,
      variants: [
        {
          id: 'v1',
          options: { 색상: '블랙' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '블랙',
          size: '',
        },
      ],
    }

    const payload = mapAdminProductDetailFormToDescriptionUpdatePayload(form)

    expect(payload.description).toBe('상세 본문')
    expect(payload.detail_media).toEqual([])
    expect(payload.short_description).toContain('__TWOTWOSHOP_INTRO_v2__')
    expect(payload).not.toHaveProperty('product_info')
    expect(payload).not.toHaveProperty('stock')
    expect(payload).not.toHaveProperty('status')
    expect(payload).not.toHaveProperty('price')
  })

  it('full update payload still includes variants and stock', () => {
    const form = {
      ...createEmptyProductDetailForm('p1'),
      name: '상품',
      slug: 'product',
      status: 'active' as const,
      stock: 5,
      variants: [
        {
          id: 'v1',
          options: { 색상: '블랙' },
          stock: 5,
          extraPrice: 0,
          sku: 'A',
          color: '블랙',
          size: '',
        },
      ],
    }

    const payload = mapAdminProductDetailFormToUpdatePayload(form)

    expect(payload.stock).toBe(5)
    expect(payload.status).toBe('active')
    expect(payload.product_info.variants).toHaveLength(1)
    expect(payload.product_info.variants[0].stock).toBe(5)
  })

  it('partial payload includes only changed pricing fields', () => {
    const baseline = {
      ...createEmptyProductDetailForm('p1'),
      name: '상품',
      slug: 'product',
      price: 10_000,
      original_price: 12_000,
      discount_rate: 17,
      stock: 5,
      status: 'active' as const,
      variants: [
        {
          id: 'v1',
          options: { 색상: '블랙' },
          stock: 5,
          extraPrice: 0,
          sku: 'A',
          color: '블랙',
          size: '',
        },
      ],
    }
    const next = { ...baseline, price: 12_000 }

    const payload = buildAdminProductDetailPartialUpdatePayload(baseline, next, {
      description: false,
      detailMedia: false,
      pricing: true,
      options: false,
      simpleStock: false,
      basicInfo: false,
      status: false,
      media: false,
      shipping: false,
      exposure: false,
      related: false,
    })

    expect(payload.price).toBe(12_000)
    expect(payload).not.toHaveProperty('product_info')
    expect(payload).not.toHaveProperty('stock')
    expect(payload).not.toHaveProperty('status')
  })

  it('partial payload updates option stocks and summed products.stock', () => {
    const baseline = {
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
    const next = {
      ...baseline,
      stock: 12,
      status: 'active' as const,
      variants: [
        { ...baseline.variants[0], stock: 3 },
        { ...baseline.variants[1], stock: 4 },
        { ...baseline.variants[2], stock: 5 },
        {
          id: 'v-navy-105',
          options: { 색상: '네이비', 사이즈: '105' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '네이비',
          size: '105',
        },
        {
          id: 'v-white-100',
          options: { 색상: '화이트', 사이즈: '100' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '화이트',
          size: '100',
        },
        {
          id: 'v-white-105',
          options: { 색상: '화이트', 사이즈: '105' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '화이트',
          size: '105',
        },
      ],
    }

    const payload = buildAdminProductDetailPartialUpdatePayload(baseline, next, {
      description: false,
      detailMedia: false,
      pricing: false,
      options: true,
      simpleStock: false,
      basicInfo: false,
      status: true,
      media: false,
      shipping: false,
      exposure: false,
      related: false,
    })

    expect(payload.stock).toBe(12)
    expect(payload.status).toBe('active')
    expect(payload).not.toHaveProperty('description')
    expect(payload).not.toHaveProperty('price')
    expect(
      (payload.product_info as { variants: Array<{ stock: number; options: Record<string, string> }> })
        .variants.map((variant) => variant.stock),
    ).toEqual([3, 4, 0, 5, 0, 0])
  })

  it('partial payload updates only detail_media when order changes', () => {
    const media = (url: string, order: number) => ({
      type: 'image' as const,
      url,
      order,
      filename: `${order}.jpg`,
      thumbnail: null,
      duration: null,
      width: null,
      height: null,
    })

    const baseline = {
      ...createEmptyProductDetailForm('p1'),
      description: '본문',
      detail_media: [media('https://example.com/1.jpg', 0), media('https://example.com/2.jpg', 1), media('https://example.com/3.jpg', 2)],
    }
    const next = {
      ...baseline,
      detail_media: [media('https://example.com/3.jpg', 0), media('https://example.com/1.jpg', 1), media('https://example.com/2.jpg', 2)],
    }

    const payload = buildAdminProductDetailPartialUpdatePayload(baseline, next, {
      description: false,
      detailMedia: true,
      pricing: false,
      options: false,
      simpleStock: false,
      basicInfo: false,
      status: false,
      media: false,
      shipping: false,
      exposure: false,
      related: false,
    })

    expect(payload).not.toHaveProperty('description')
    expect(payload).not.toHaveProperty('price')
    expect(payload.detail_media).toEqual([
      expect.objectContaining({ url: 'https://example.com/3.jpg', order: 0 }),
      expect.objectContaining({ url: 'https://example.com/1.jpg', order: 1 }),
      expect.objectContaining({ url: 'https://example.com/2.jpg', order: 2 }),
    ])
  })
})
