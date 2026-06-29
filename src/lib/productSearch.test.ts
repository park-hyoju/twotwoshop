import { describe, expect, it } from 'vitest'
import type { Product } from '../types/product'
import {
  EMPTY_PRODUCT_INFO,
  EMPTY_PRODUCT_RETURN_INFO,
  EMPTY_PRODUCT_SHIPPING_INFO,
  EMPTY_PRODUCT_SIZE_GUIDE,
} from '../types/productDetail'
import { buildProductSearchUrl, filterProductsBySearch, matchesProductSearch } from './productSearch'

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

describe('matchesProductSearch', () => {
  const product = createProduct()

  it('matches product name', () => {
    expect(matchesProductSearch(product, '린넨')).toBe(true)
  })

  it('matches slug', () => {
    expect(matchesProductSearch(product, 'classic-linen')).toBe(true)
  })

  it('matches description', () => {
    expect(matchesProductSearch(product, '데일리')).toBe(true)
  })

  it('matches tags', () => {
    expect(matchesProductSearch(product, 'summer')).toBe(true)
  })

  it('matches category label', () => {
    expect(matchesProductSearch(product, '상의')).toBe(true)
  })

  it('ignores whitespace in query', () => {
    expect(matchesProductSearch(product, '린 넨')).toBe(true)
  })

  it('returns false for unrelated queries', () => {
    expect(matchesProductSearch(product, '운동화')).toBe(false)
  })
})

describe('filterProductsBySearch', () => {
  it('returns all products when query is empty', () => {
    const products = [createProduct(), createProduct({ id: 'p-2', slug: 'other-item' })]
    expect(filterProductsBySearch(products, '   ')).toHaveLength(2)
  })

  it('filters products by query', () => {
    const products = [
      createProduct(),
      createProduct({
        id: 'p-2',
        slug: 'wide-slacks',
        name: '와이드 슬랙스',
        tags: ['slacks'],
      }),
    ]

    expect(filterProductsBySearch(products, '슬랙스')).toHaveLength(1)
  })
})

describe('buildProductSearchUrl', () => {
  it('builds products search url', () => {
    expect(buildProductSearchUrl('린넨 셔츠')).toBe('/products?search=%EB%A6%B0%EB%84%A8+%EC%85%94%EC%B8%A0')
    expect(buildProductSearchUrl('   ')).toBe('/products')
  })
})
