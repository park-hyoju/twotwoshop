import { describe, expect, it } from 'vitest'
import { PRODUCTS } from '../data/products'
import type { Product } from '../types/product'
import type { CartItem } from '../types/cart'
import { syncCartItemsWithResolver } from './cartSync'

const SUPABASE_UUID = '11111111-1111-4111-8111-111111111111'
const LEGACY_ID = 'p-w-001'

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    ...PRODUCTS[0],
    id: SUPABASE_UUID,
    ...overrides,
  }
}

function createCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
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
