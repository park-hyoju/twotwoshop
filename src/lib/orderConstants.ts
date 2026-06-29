/** Flat shipping fee applied to every order (KRW). */
export const SHIPPING_FEE = 4000

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
  shippingFee = SHIPPING_FEE,
): number {
  const discount = calculateCouponDiscount(productTotal, couponDiscount)
  return Math.max(productTotal - discount + shippingFee, 0)
}
