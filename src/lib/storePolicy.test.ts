import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_STORE_POLICY,
  loadStorePolicy,
  saveStorePolicy,
} from './storePolicy'
import {
  SHIPPING_POLICY_ADDITIONAL_NOTES,
  SHIPPING_POLICY_FREE_DETAIL,
  SHIPPING_POLICY_PAID_DETAIL,
  SHIPPING_POLICY_SUMMARY,
} from './orderConstants'

describe('storePolicy', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses updated shipping policy defaults', () => {
    expect(DEFAULT_STORE_POLICY.shipping.shipping_fee).toBe(SHIPPING_POLICY_PAID_DETAIL)
    expect(DEFAULT_STORE_POLICY.shipping.free_shipping_threshold).toBe(
      SHIPPING_POLICY_FREE_DETAIL,
    )
    expect(DEFAULT_STORE_POLICY.shipping.additional_notes).toBe(SHIPPING_POLICY_ADDITIONAL_NOTES)
  })

  it('migrates legacy flat shipping copy from localStorage', () => {
    const storageKey = 'twotwoshop-store-policy'

    saveStorePolicy({
      shipping: {
        shipping_fee: '전 상품 배송비 4,000원',
        delivery_period: '3~5일',
        free_shipping_threshold: '',
        additional_notes:
          '전 상품 배송비 4,000원이 적용됩니다.\n제주 및 도서산간 지역은 추가 배송비가 발생할 수 있습니다.',
      },
      returns: DEFAULT_STORE_POLICY.returns,
    })

    const loaded = loadStorePolicy()

    expect(loaded.shipping.shipping_fee).toBe(SHIPPING_POLICY_PAID_DETAIL)
    expect(loaded.shipping.free_shipping_threshold).toBe(SHIPPING_POLICY_FREE_DETAIL)
    expect(loaded.shipping.additional_notes).toBe(SHIPPING_POLICY_ADDITIONAL_NOTES)
    expect(loaded.shipping.shipping_fee).not.toContain('전 상품')
    expect(storage.has(storageKey)).toBe(true)
  })
})

describe('benefits shipping copy', () => {
  it('uses free-shipping summary on the home benefit card', async () => {
    const { benefits } = await import('../data/benefits')
    const shippingBenefit = benefits.find((benefit) => benefit.id === 'shipping')

    expect(shippingBenefit?.description).toBe(SHIPPING_POLICY_SUMMARY)
    expect(shippingBenefit?.description).not.toContain('전 상품')
  })
})
