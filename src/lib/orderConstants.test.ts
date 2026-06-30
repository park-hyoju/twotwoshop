import { describe, expect, it } from 'vitest'
import {
  COUPON_MIN_ORDER_AMOUNT,
  FREE_SHIPPING_MIN_SUBTOTAL,
  SHIPPING_FEE,
  WELCOME_COUPON_DISCOUNT,
  WELCOME_COUPON_TITLE,
  calculateOrderTotal,
  calculateShippingFee,
  formatCouponUsageHint,
  getShippingPolicyHint,
  isCouponApplicable,
} from './orderConstants'
import { getApplicableCoupons } from '../services/couponRepository'
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

describe('orderConstants', () => {
  it('defines base shipping fee as 4000', () => {
    expect(SHIPPING_FEE).toBe(4000)
    expect(FREE_SHIPPING_MIN_SUBTOTAL).toBe(70000)
    expect(WELCOME_COUPON_DISCOUNT).toBe(5000)
  })

  it('charges 4000 shipping below 70000 subtotal', () => {
    expect(calculateShippingFee(69000)).toBe(4000)
    expect(getShippingPolicyHint(69000)).toBe('70,000원 미만 배송비 4,000원')
    expect(calculateOrderTotal(69000)).toBe(73000)
  })

  it('applies free shipping at 70000 subtotal or above', () => {
    expect(calculateShippingFee(70000)).toBe(0)
    expect(calculateShippingFee(108000)).toBe(0)
    expect(getShippingPolicyHint(70000)).toBe('70,000원 이상 무료배송')
    expect(calculateOrderTotal(70000)).toBe(70000)
    expect(calculateOrderTotal(108000)).toBe(108000)
  })

  it('rejects coupon use below 70000 subtotal', () => {
    expect(isCouponApplicable(69000, COUPON_MIN_ORDER_AMOUNT)).toBe(false)
    expect(getApplicableCoupons([welcomeCoupon], 69000)).toHaveLength(0)
    expect(calculateOrderTotal(69000, 0)).toBe(73000)
  })

  it('allows coupon at 70000 subtotal with final total 65000', () => {
    expect(isCouponApplicable(70000, COUPON_MIN_ORDER_AMOUNT)).toBe(true)
    expect(getApplicableCoupons([welcomeCoupon], 70000)).toHaveLength(1)
    expect(calculateOrderTotal(70000, WELCOME_COUPON_DISCOUNT)).toBe(65000)
  })

  it('keeps free shipping when coupon is applied at 70000 subtotal', () => {
    expect(calculateShippingFee(70000)).toBe(0)
    expect(calculateOrderTotal(70000, WELCOME_COUPON_DISCOUNT)).toBe(65000)
  })

  it('formats coupon usage hint', () => {
    expect(formatCouponUsageHint()).toBe('70,000원 이상 구매 시 사용 가능')
  })
})
