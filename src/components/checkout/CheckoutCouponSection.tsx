import { formatCouponUsageHint } from '../../lib/orderConstants'
import type { MemberCoupon } from '../../types/coupon'

interface CheckoutCouponSectionProps {
  isMember: boolean
  coupons: MemberCoupon[]
  applicableCoupons: MemberCoupon[]
  selectedCouponId: string | null
  productTotal: number
  onSelectCoupon: (couponId: string | null) => void
}

export function CheckoutCouponSection({
  isMember,
  coupons,
  applicableCoupons,
  selectedCouponId,
  productTotal,
  onSelectCoupon,
}: CheckoutCouponSectionProps) {
  if (!isMember) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
        <p className="font-semibold text-neutral-800">③ 쿠폰 사용</p>
        <p className="mt-2">로그인 후 쿠폰을 사용할 수 있습니다.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
          3
        </span>
        <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">쿠폰 사용</h2>
      </div>

      {coupons.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5 text-sm text-neutral-600">
          사용 가능한 쿠폰이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-4 py-3">
            <input
              type="radio"
              name="checkout-coupon"
              checked={selectedCouponId === null}
              onChange={() => onSelectCoupon(null)}
              className="mt-1"
            />
            <span className="text-sm text-neutral-700">쿠폰 사용 안 함</span>
          </label>

          {coupons.map((coupon) => {
            const isApplicable = productTotal >= coupon.minOrderAmount
            const isSelected = selectedCouponId === coupon.id

            return (
              <label
                key={coupon.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${
                  isSelected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'
                } ${!isApplicable ? 'opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name="checkout-coupon"
                  checked={isSelected}
                  disabled={!isApplicable}
                  onChange={() => onSelectCoupon(coupon.id)}
                  className="mt-1"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">{coupon.title}</span>
                  <span className="mt-1 block text-sm text-neutral-600">
                    {formatCouponUsageHint(coupon.minOrderAmount)}
                  </span>
                  {!isApplicable ? (
                    <span className="mt-1 block text-xs text-red-600">
                      현재 주문 금액으로는 사용할 수 없습니다.
                    </span>
                  ) : null}
                </span>
              </label>
            )
          })}
        </div>
      )}

      {applicableCoupons.length > 0 && selectedCouponId ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">
          선택한 쿠폰 할인이 결제 금액에 반영됩니다.
        </p>
      ) : null}
    </section>
  )
}
