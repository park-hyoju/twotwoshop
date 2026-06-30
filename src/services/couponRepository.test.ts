import { describe, expect, it } from 'vitest'
import {
  COUPON_MIN_ORDER_AMOUNT,
  WELCOME_COUPON_DISCOUNT,
  WELCOME_COUPON_TITLE,
  calculateOrderTotal,
} from '../lib/orderConstants'
import { getApplicableCoupons } from './couponRepository'
import type { MemberCoupon } from '../types/coupon'

const welcomeCoupon: MemberCoupon = {
  id: 'mc-1',
  couponId: 'c-1',
  code: 'WELCOME5000',
  title: WELCOME_COUPON_TITLE,
  discountAmount: WELCOME_COUPON_DISCOUNT,
  minOrderAmount: COUPON_MIN_ORDER_AMOUNT,
  expiresAt: null,
}

describe('couponRepository', () => {
  it('exposes only coupons meeting minimum order amount', () => {
    expect(getApplicableCoupons([welcomeCoupon], 69000)).toHaveLength(0)
    expect(getApplicableCoupons([welcomeCoupon], 70000)).toEqual([welcomeCoupon])
  })

  it('keeps order total unchanged when coupon is not applicable', () => {
    expect(calculateOrderTotal(69000, 0)).toBe(73000)
  })
})
