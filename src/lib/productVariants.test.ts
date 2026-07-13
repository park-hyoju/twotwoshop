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
  getProductOptionGroups,
  getProductOptionStock,
  hasProductOptions,
  isProductOptionSelectionComplete,
  parseProductVariants,
  resolveProductOptionGroups,
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
  optionGroups: [],
  variants: [
    {
      id: 'v1',
      options: { 색상: '진청', 사이즈: '55' },
      color: '진청',
      size: '55',
      stock: 3,
      extraPrice: 0,
      sku: '',
    },
    {
      id: 'v2',
      options: { 색상: '진청', 사이즈: '66' },
      color: '진청',
      size: '66',
      stock: 0,
      extraPrice: 0,
      sku: '',
    },
    {
      id: 'v3',
      options: { 색상: '흑청', 사이즈: '55' },
      color: '흑청',
      size: '55',
      stock: 5,
      extraPrice: 0,
      sku: '',
    },
  ],
}

describe('productVariants', () => {
  it('parses variants from product_info json', () => {
    expect(
      parseProductVariants({
        variants: [{ id: 'v1', color: '진청', size: '55', stock: 2 }],
      }),
    ).toEqual([
      {
        id: 'v1',
        options: { 색상: '진청', 사이즈: '55' },
        color: '진청',
        size: '55',
        stock: 2,
        extraPrice: 0,
        sku: '',
      },
    ])
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

  it('ignores admin row-based optionGroups that do not match variant option keys', () => {
    const product = {
      ...productWithOptions,
      optionGroups: [
        { name: '베이지', values: ['95', '100'] },
        { name: '브라운', values: ['95', '100'] },
      ],
      variants: [
        {
          id: 'v1',
          options: { 색상: '베이지', 사이즈: '95' },
          color: '베이지',
          size: '95',
          stock: 3,
          extraPrice: 0,
          sku: '',
        },
        {
          id: 'v2',
          options: { 색상: '베이지', 사이즈: '100' },
          color: '베이지',
          size: '100',
          stock: 4,
          extraPrice: 0,
          sku: '',
        },
        {
          id: 'v3',
          options: { 색상: '브라운', 사이즈: '95' },
          color: '브라운',
          size: '95',
          stock: 5,
          extraPrice: 0,
          sku: '',
        },
        {
          id: 'v4',
          options: { 색상: '브라운', 사이즈: '100' },
          color: '브라운',
          size: '100',
          stock: 6,
          extraPrice: 0,
          sku: '',
        },
      ],
    }

    expect(resolveProductOptionGroups(product.optionGroups, product.variants)).toEqual([
      { name: '색상', values: ['베이지', '브라운'] },
      { name: '사이즈', values: ['95', '100'] },
    ])
    expect(getProductOptionGroups(product)).toEqual([
      { name: '색상', values: ['베이지', '브라운'] },
      { name: '사이즈', values: ['95', '100'] },
    ])
    expect(
      getProductOptionStock(product, '', '', { 색상: '베이지', 사이즈: '95' }),
    ).toBe(3)
    expect(isProductOptionSelectionComplete(product, '', '', { 색상: '베이지', 사이즈: '100' })).toBe(
      true,
    )
  })
})
