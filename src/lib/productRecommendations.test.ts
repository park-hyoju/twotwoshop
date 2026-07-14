import { describe, expect, it, vi, beforeEach } from 'vitest'
import { loadProductRecommendations, MAX_PRODUCT_RECOMMENDATIONS } from './productRecommendations'
import type { Product } from '../types/product'

vi.mock('../services/productRepository', () => ({
  productRepository: {
    findRelatedProducts: vi.fn(),
    findProductsByProductCategory: vi.fn(),
  },
}))

import { productRepository } from '../services/productRepository'

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-a',
    slug: 'product-a',
    name: '상품 A',
    shortDescription: '',
    description: '',
    detailMedia: [],
    price: 10000,
    originalPrice: 12000,
    discountRate: 10,
    thumbnail: '/a.jpg',
    images: [],
    productCategory: 'women_top',
    gender: 'women',
    displayCategory: 'top',
    detailCategory: 'shirt',
    tags: [],
    isNew: false,
    isBest: false,
    isSale: false,
    stock: 5,
    soldOut: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    sizeGuide: { rows: [], model_info: '' },
    productInfo: {
      material: '',
      origin_country: '',
      manufacturer: '',
      care_instructions: '',
      thickness: '',
      stretch: '',
      sheer: '',
      lining: '',
      fit: '',
    },
    shippingInfo: {
      shipping_fee: '',
      delivery_period: '',
      free_shipping_threshold: '',
      additional_notes: '',
    },
    returnInfo: {
      exchange_period: '',
      return_address: '',
      eligible_cases: '',
      ineligible_cases: '',
      shipping_fee_notes: '',
    },
    optionGroups: [],
    variants: [],
    ...overrides,
  }
}

describe('loadProductRecommendations', () => {
  beforeEach(() => {
    vi.mocked(productRepository.findRelatedProducts).mockReset()
    vi.mocked(productRepository.findProductsByProductCategory).mockReset()
  })

  it('returns curated related products in saved order only', async () => {
    const curatedB = createProduct({ id: 'b', slug: 'b', name: 'B' })
    const curatedC = createProduct({ id: 'c', slug: 'c', name: 'C' })

    vi.mocked(productRepository.findRelatedProducts).mockResolvedValue([curatedB, curatedC])
    vi.mocked(productRepository.findProductsByProductCategory).mockResolvedValue([
      createProduct({ id: 'd', slug: 'd', name: 'D' }),
    ])

    const result = await loadProductRecommendations(createProduct())

    expect(result.map((item) => item.id)).toEqual(['b', 'c'])
    expect(productRepository.findProductsByProductCategory).not.toHaveBeenCalled()
  })

  it('does not auto-fill with same-category products', async () => {
    const curatedB = createProduct({ id: 'b', slug: 'b', name: 'B' })

    vi.mocked(productRepository.findRelatedProducts).mockResolvedValue([curatedB])
    vi.mocked(productRepository.findProductsByProductCategory).mockResolvedValue([
      createProduct({ id: 'c', slug: 'c', name: 'C' }),
      createProduct({ id: 'd', slug: 'd', name: 'D' }),
      createProduct({ id: 'e', slug: 'e', name: 'E' }),
    ])

    const result = await loadProductRecommendations(createProduct())

    expect(result.map((item) => item.id)).toEqual(['b'])
    expect(result).toHaveLength(1)
    expect(productRepository.findProductsByProductCategory).not.toHaveBeenCalled()
  })

  it('returns empty when no curated related products are saved', async () => {
    vi.mocked(productRepository.findRelatedProducts).mockResolvedValue([])
    vi.mocked(productRepository.findProductsByProductCategory).mockResolvedValue([
      createProduct({ id: 'b', slug: 'b', stock: 3 }),
      createProduct({ id: 'c', slug: 'c', stock: 3 }),
    ])

    const result = await loadProductRecommendations(createProduct())

    expect(result).toEqual([])
    expect(productRepository.findProductsByProductCategory).not.toHaveBeenCalled()
  })

  it('excludes sold-out curated products and caps at max', async () => {
    vi.mocked(productRepository.findRelatedProducts).mockResolvedValue([
      createProduct({ id: 'b', slug: 'b', stock: 0, soldOut: true }),
      createProduct({ id: 'c', slug: 'c', stock: 3 }),
      createProduct({ id: 'd', slug: 'd', stock: 3 }),
      createProduct({ id: 'e', slug: 'e', stock: 3 }),
      createProduct({ id: 'f', slug: 'f', stock: 3 }),
      createProduct({ id: 'g', slug: 'g', stock: 3 }),
    ])

    const result = await loadProductRecommendations(createProduct())

    expect(result.map((item) => item.id)).toEqual(['c', 'd', 'e', 'f'])
    expect(result).toHaveLength(MAX_PRODUCT_RECOMMENDATIONS)
  })
})
