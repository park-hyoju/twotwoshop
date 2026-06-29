import { describe, expect, it } from 'vitest'
import { convertEngToKor, isEngKeyboardInput } from './convertEngToKor'
import { keywordsMatch, normalizeKeywordForMatch } from './normalizeKeyword'
import type { Product } from '../../types/product'
import {
  EMPTY_PRODUCT_INFO,
  EMPTY_PRODUCT_RETURN_INFO,
  EMPTY_PRODUCT_SHIPPING_INFO,
  EMPTY_PRODUCT_SIZE_GUIDE,
} from '../../types/productDetail'
import { filterProductsByKeyword, searchProducts } from './searchProducts'

describe('convertEngToKor', () => {
  it('converts mistyped keyboard input to hangul', () => {
    expect(convertEngToKor('xltucm')).toBe('티셔츠')
    expect(convertEngToKor('dkdlvhs')).toBe('아이폰')
    expect(convertEngToKor('gksrnr')).toBe('한국')
  })

  it('detects english keyboard input', () => {
    expect(isEngKeyboardInput('xltucm')).toBe(true)
    expect(isEngKeyboardInput('티셔츠')).toBe(false)
    expect(isEngKeyboardInput('shirt 123')).toBe(false)
  })
})

describe('normalizeKeyword', () => {
  it('ignores case', () => {
    expect(keywordsMatch('Perfume', '프리미엄 PERFUME')).toBe(true)
    expect(keywordsMatch('perfume', 'Premium Perfume')).toBe(true)
  })

  it('ignores whitespace', () => {
    expect(normalizeKeywordForMatch('반 팔 티')).toBe('반팔티')
    expect(keywordsMatch('반팔티', '여름 반팔 티')).toBe(true)
    expect(keywordsMatch('반 팔 티', '여름반팔티')).toBe(true)
  })

  it('supports partial matches', () => {
    expect(keywordsMatch('원피', '플라워 원피스')).toBe(true)
    expect(keywordsMatch('향', '시트러스 향수')).toBe(true)
  })
})

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p-1',
    slug: 'classic-linen-shirt',
    name: '클래식 린넨 셔츠',
    shortDescription: '시원한 린넨 데일리 셔츠',
    description: '시원한 린넨 소재의 데일리 셔츠입니다.',
    price: 69000,
    originalPrice: 89000,
    discountRate: 22,
    thumbnail: '/images/placeholder/classic-linen-shirt.jpg',
    images: ['/images/placeholder/classic-linen-shirt.jpg'],
    productCategory: 'women_top',
    gender: 'women',
    displayCategory: 'top',
    detailCategory: 'shirt',
    tags: ['linen', 'summer', 'shirt'],
    isNew: false,
    isBest: false,
    isSale: false,
    stock: 42,
    soldOut: false,
    status: 'active',
    createdAt: '2026-05-10T09:00:00.000Z',
    updatedAt: '2026-05-10T09:00:00.000Z',
    sizeGuide: { ...EMPTY_PRODUCT_SIZE_GUIDE, rows: [] },
    productInfo: { ...EMPTY_PRODUCT_INFO },
    shippingInfo: { ...EMPTY_PRODUCT_SHIPPING_INFO },
    returnInfo: { ...EMPTY_PRODUCT_RETURN_INFO },
    ...overrides,
  }
}

describe('searchProducts', () => {
  const products = [
    createProduct(),
    createProduct({
      id: 'p-2',
      slug: 'floral-dress',
      name: '플라워 원피스',
      shortDescription: '봄 데일리 원피스',
      description: '가볍게 입기 좋은 원피스',
      productCategory: 'women_dress',
      tags: ['dress'],
    }),
    createProduct({
      id: 'p-3',
      slug: 'citrus-perfume',
      name: '시트러스 향수',
      shortDescription: '상큼한 향수',
      description: '데일리 향수',
      productCategory: 'perfume',
      tags: ['perfume'],
    }),
  ]

  it('searches product name, description, and category', () => {
    expect(filterProductsByKeyword(products, '원피스')).toHaveLength(1)
    expect(filterProductsByKeyword(products, '향수')).toHaveLength(1)
    expect(filterProductsByKeyword(products, '여성 · 상의')).toHaveLength(1)
  })

  it('falls back to eng-to-kor correction when no primary results', () => {
    const result = searchProducts(products, 'xltucm')
    expect(result.wasCorrected).toBe(false)

    const shirtProducts = [
      createProduct({
        name: '코튼 티셔츠',
        shortDescription: '데일리 티셔츠',
        description: '부드러운 코튼 티셔츠',
      }),
    ]

    const corrected = searchProducts(shirtProducts, 'xltucm')
    expect(corrected.wasCorrected).toBe(true)
    expect(corrected.correctedQuery).toBe('티셔츠')
    expect(corrected.products).toHaveLength(1)
  })
})
