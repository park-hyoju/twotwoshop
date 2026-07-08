import { describe, expect, it } from 'vitest'
import { getProductDetailReturnDisplay, getProductDetailShippingDisplay } from './productDetailPolicyDisplay'
import type { Product } from '../types/product'

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '1',
    slug: 'test-product',
    name: '테스트 상품',
    shortDescription: '',
    description: '',
    detailMedia: [],
    price: 10000,
    originalPrice: 12000,
    discountRate: 10,
    thumbnail: '/thumb.jpg',
    images: [],
    productCategory: 'women_top',
    gender: 'women',
    displayCategory: 'top',
    detailCategory: 'shirt',
    tags: [],
    isNew: false,
    isBest: false,
    isSale: false,
    stock: 10,
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
    variants: [],
    ...overrides,
  }
}

describe('productDetailPolicyDisplay', () => {
  it('maps shipping fields for customer tabs', () => {
    const display = getProductDetailShippingDisplay(
      createProduct({
        shippingInfo: {
          shipping_fee: '3,000원',
          free_shipping_threshold: '50,000원 이상 무료',
          delivery_period: '결제 후 1~2일 이내 출고\n택배 수령까지 2~3일',
          additional_notes: 'CJ대한통운 이용',
        },
      }),
    )

    expect(display.shippingFee).toBe('3,000원')
    expect(display.freeShippingCondition).toBe('50,000원 이상 무료')
    expect(display.dispatchPeriod).toBe('결제 후 1~2일 이내 출고')
    expect(display.deliveryDuration).toBe('택배 수령까지 2~3일')
    expect(display.courier).toBe('CJ대한통운 이용')
  })

  it('maps return fields for customer tabs', () => {
    const display = getProductDetailReturnDisplay(
      createProduct({
        returnInfo: {
          exchange_period: '수령 후 7일 이내',
          return_address: '서울시 강남구',
          eligible_cases: '',
          ineligible_cases: '착용 흔적이 있는 경우',
          shipping_fee_notes: '단순 변심 왕복 6,000원\n불량 시 무료',
        },
      }),
    )

    expect(display.exchangePeriod).toBe('수령 후 7일 이내')
    expect(display.exchangeShippingFee).toBe('단순 변심 왕복 6,000원')
    expect(display.returnShippingFee).toBe('단순 변심 왕복 6,000원')
    expect(display.returnAddress).toBe('서울시 강남구')
    expect(display.ineligibleReasons).toBe('착용 흔적이 있는 경우')
  })
})
