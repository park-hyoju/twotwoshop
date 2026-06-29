export interface MemberCoupon {
  id: string
  couponId: string
  code: string
  title: string
  discountAmount: number
  minOrderAmount: number
  expiresAt: string | null
}
