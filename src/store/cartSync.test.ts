import { describe, expect, it } from 'vitest'
import {
  EMPTY_PRODUCT_INFO,
  EMPTY_PRODUCT_RETURN_INFO,
  EMPTY_PRODUCT_SHIPPING_INFO,
  EMPTY_PRODUCT_SIZE_GUIDE,
} from '../types/productDetail'
import type { Product } from '../types/product'
import type { CartItem } from '../types/cart'
import { syncCartItemsWithResolver } from './cartSync'

const SUPABASE_UUID = '11111111-1111-4111-8111-111111111111'
const LEGACY_ID = 'p-w-001'

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: SUPABASE_UUID,
    slug: 'classic-linen-shirt',
    name: '클래식 린넨 셔츠',
    shortDescription: '시원한 린넨 데일리 셔츠',
    description: '시원한 린넨 소재의 데일리 셔츠입니다.',
    detailMedia: [],
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
    stock: 10,
    soldOut: false,
    status: 'active',
    createdAt: '2026-05-10T09:00:00.000Z',
    updatedAt: '2026-05-10T09:00:00.000Z',
    sizeGuide: { ...EMPTY_PRODUCT_SIZE_GUIDE, rows: [] },
    productInfo: { ...EMPTY_PRODUCT_INFO },
    shippingInfo: { ...EMPTY_PRODUCT_SHIPPING_INFO },
    returnInfo: { ...EMPTY_PRODUCT_RETURN_INFO },
    optionGroups: [],
    variants: [],
    ...overrides,
  }
}

function createCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    cartLineId: LEGACY_ID,
    productId: LEGACY_ID,
    slug: 'classic-linen-shirt',
    name: '클래식 린넨 셔츠',
    price: 69000,
    thumbnail: '/images/placeholder/classic-linen-shirt.jpg',
    quantity: 1,
    stock: 10,
    ...overrides,
  }
}

describe('syncCartItemsWithResolver', () => {
  it('keeps UUID cart items by resolving slug and updates productId to Supabase UUID', async () => {
    const result = await syncCartItemsWithResolver(
      [createCartItem({ productId: LEGACY_ID })],
      async () => createProduct(),
    )

    expect(result.notices).not.toContain('unavailableRemoved')
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.productId).toBe(SUPABASE_UUID)
    expect(result.items[0]?.slug).toBe('classic-linen-shirt')
    expect(result.items[0]?.quantity).toBe(1)
  })

  it('removes hidden products', async () => {
    const result = await syncCartItemsWithResolver(
      [createCartItem()],
      async () => createProduct({ status: 'hidden' }),
    )

    expect(result.items).toHaveLength(0)
    expect(result.notices).toContain('unavailableRemoved')
  })

  it('removes products that no longer exist', async () => {
    const result = await syncCartItemsWithResolver(
      [createCartItem({ slug: 'missing-product' })],
      async () => undefined,
    )

    expect(result.items).toHaveLength(0)
    expect(result.notices).toContain('unavailableRemoved')
  })

  it('keeps stock 0 products as sold out instead of removing them', async () => {
    const result = await syncCartItemsWithResolver(
      [createCartItem({ stock: 5, quantity: 2 })],
      async () => createProduct({ stock: 0, soldOut: true, status: 'active' }),
    )

    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.stock).toBe(0)
    expect(result.items[0]?.quantity).toBe(2)
    expect(result.notices).toContain('soldOutDetected')
    expect(result.notices).not.toContain('unavailableRemoved')
  })

  it('updates price when catalog price changes', async () => {
    const result = await syncCartItemsWithResolver(
      [createCartItem({ price: 50000 })],
      async () => createProduct({ price: 69000 }),
    )

    expect(result.items[0]?.price).toBe(69000)
    expect(result.items[0]?.productId).toBe(SUPABASE_UUID)
    expect(result.notices).toContain('infoChanged')
  })

  it('adjusts quantity when stock is lower than cart quantity', async () => {
    const result = await syncCartItemsWithResolver(
      [createCartItem({ quantity: 5, stock: 5 })],
      async () => createProduct({ stock: 2 }),
    )

    expect(result.items[0]?.quantity).toBe(2)
    expect(result.items[0]?.stock).toBe(2)
    expect(result.notices).toContain('quantityAdjusted')
  })
})
