/** Standard shipping fee when subtotal is below free-shipping threshold (KRW). */
export const SHIPPING_FEE = 4000

/** Subtotal threshold for free shipping (before coupon discount). */
export const FREE_SHIPPING_MIN_SUBTOTAL = 70_000

/** Welcome coupon minimum order amount (KRW). */
export const COUPON_MIN_ORDER_AMOUNT = 70_000

/** Welcome coupon discount amount (KRW). */
export const WELCOME_COUPON_DISCOUNT = 5_000

export const WELCOME_COUPON_TITLE = '신규회원 5,000원 할인'

export function calculateShippingFee(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return SHIPPING_FEE
  }

  return subtotal >= FREE_SHIPPING_MIN_SUBTOTAL ? 0 : SHIPPING_FEE
}

export function formatShippingFeeLabel(shippingFee: number): string {
  return shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString('ko-KR')}원`
}

export function getShippingPolicyHint(subtotal: number): string {
  return subtotal >= FREE_SHIPPING_MIN_SUBTOTAL
    ? '70,000원 이상 무료배송'
    : '70,000원 미만 배송비 4,000원'
}

export function formatCouponUsageHint(minOrderAmount = COUPON_MIN_ORDER_AMOUNT): string {
  return `${minOrderAmount.toLocaleString('ko-KR')}원 이상 구매 시 사용 가능`
}

export function calculateCouponDiscount(
  productTotal: number,
  couponDiscountAmount: number,
): number {
  if (!Number.isFinite(couponDiscountAmount) || couponDiscountAmount <= 0) {
    return 0
  }

  return Math.min(Math.trunc(couponDiscountAmount), productTotal)
}

export function calculateOrderTotal(
  productTotal: number,
  couponDiscount = 0,
): number {
  const discount = calculateCouponDiscount(productTotal, couponDiscount)
  const shippingFee = calculateShippingFee(productTotal)
  return Math.max(productTotal - discount + shippingFee, 0)
}

export function isCouponApplicable(productTotal: number, minOrderAmount: number): boolean {
  return productTotal >= minOrderAmount
}
