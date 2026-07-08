import { describe, expect, it } from 'vitest'
import type { Product } from '../types/product'
import {
  EMPTY_PRODUCT_INFO,
  EMPTY_PRODUCT_RETURN_INFO,
  EMPTY_PRODUCT_SHIPPING_INFO,
  EMPTY_PRODUCT_SIZE_GUIDE,
} from '../types/productDetail'
import {
  findProductVariant,
  getProductOptionStock,
  hasProductOptions,
  isProductOptionSelectionComplete,
  parseProductVariants,
} from './productVariants'

const productWithOptions: Product = {
  id: 'p1',
  slug: 'denim',
  name: '데님',
  shortDescription: '',
  description: '',
  detailMedia: [],
  price: 59000,
  originalPrice: 89000,
  discountRate: 34,
  thumbnail: '/a.jpg',
  images: ['/a.jpg'],
  productCategory: 'women_bottom',
  gender: 'women',
  displayCategory: 'bottom',
  detailCategory: 'pants',
  tags: [],
  isNew: false,
  isBest: false,
  isSale: false,
  stock: 10,
  soldOut: false,
  createdAt: '',
  updatedAt: '',
  status: 'active',
  sizeGuide: { ...EMPTY_PRODUCT_SIZE_GUIDE, rows: [] },
  productInfo: { ...EMPTY_PRODUCT_INFO },
  shippingInfo: { ...EMPTY_PRODUCT_SHIPPING_INFO },
  returnInfo: { ...EMPTY_PRODUCT_RETURN_INFO },
  variants: [
    { id: 'v1', color: '진청', size: '55', stock: 3 },
    { id: 'v2', color: '진청', size: '66', stock: 0 },
    { id: 'v3', color: '흑청', size: '55', stock: 5 },
  ],
}

describe('productVariants', () => {
  it('parses variants from product_info json', () => {
    expect(
      parseProductVariants({
        variants: [{ id: 'v1', color: '진청', size: '55', stock: 2 }],
      }),
    ).toEqual([{ id: 'v1', color: '진청', size: '55', stock: 2 }])
  })

  it('detects option products and resolves variant stock', () => {
    expect(hasProductOptions(productWithOptions)).toBe(true)
    expect(getProductOptionStock(productWithOptions, '진청', '55')).toBe(3)
    expect(getProductOptionStock(productWithOptions, '진청', '66')).toBe(0)
    expect(findProductVariant(productWithOptions.variants, '흑청', '55')?.id).toBe('v3')
  })

  it('requires color and size before selection is complete', () => {
    expect(isProductOptionSelectionComplete(productWithOptions, '', '')).toBe(false)
    expect(isProductOptionSelectionComplete(productWithOptions, '진청', '')).toBe(false)
    expect(isProductOptionSelectionComplete(productWithOptions, '진청', '55')).toBe(true)
  })
})
