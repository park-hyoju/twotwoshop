import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { logSupabaseError } from '../utils/errorLog'
import type { MemberCoupon } from '../types/coupon'

export class CouponRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'CouponRepositoryError'
    this.cause = cause
  }
}

function parseMemberCouponRow(item: unknown): MemberCoupon | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const row = item as Record<string, unknown>

  if (
    typeof row.id !== 'string' ||
    typeof row.coupon_id !== 'string' ||
    typeof row.code !== 'string' ||
    typeof row.title !== 'string' ||
    typeof row.discount_amount !== 'number' ||
    typeof row.min_order_amount !== 'number'
  ) {
    return null
  }

  return {
    id: row.id,
    couponId: row.coupon_id,
    code: row.code,
    title: row.title,
    discountAmount: row.discount_amount,
    minOrderAmount: row.min_order_amount,
    expiresAt: typeof row.expires_at === 'string' ? row.expires_at : null,
  }
}

export async function issueWelcomeCoupon(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const { error } = await supabase.rpc('ensure_welcome_coupon')

  if (error) {
    logSupabaseError('couponRepository.ensure_welcome_coupon', error)
  }
}

export async function fetchMemberCoupons(): Promise<MemberCoupon[]> {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  try {
    await issueWelcomeCoupon()
  } catch {
    // optional bootstrap
  }

  const { data, error } = await supabase.rpc('get_member_coupons')

  if (error) {
    logSupabaseError('couponRepository.get_member_coupons', error)
    throw new CouponRepositoryError('쿠폰 목록을 불러오지 못했습니다.', error)
  }

  let rows: unknown = data
  if (typeof data === 'string') {
    try {
      rows = JSON.parse(data) as unknown
    } catch {
      return []
    }
  }

  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map(parseMemberCouponRow)
    .filter((item): item is MemberCoupon => item !== null)
}

export function getApplicableCoupons(
  coupons: MemberCoupon[],
  productTotal: number,
): MemberCoupon[] {
  return coupons.filter((coupon) => productTotal >= coupon.minOrderAmount)
}

export function findSelectedCoupon(
  coupons: MemberCoupon[],
  selectedCouponId: string | null,
): MemberCoupon | null {
  if (!selectedCouponId) {
    return null
  }

  return coupons.find((coupon) => coupon.id === selectedCouponId) ?? null
}
