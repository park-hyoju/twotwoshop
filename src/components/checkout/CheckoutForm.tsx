import { formatPrice } from '../../lib/formatPrice'
import type { MemberCoupon } from '../../types/coupon'
import type { CheckoutFormData, CheckoutFormErrors } from '../../types/order'
import { DepositAccountInfo } from '../deposit/DepositAccountInfo'
import { AddressSearchFields } from '../address/AddressSearchFields'
import { ShippingFeeRow } from '../orders/ShippingFeeRow'
import { CheckoutCouponSection } from './CheckoutCouponSection'

interface CheckoutFormProps {
  form: CheckoutFormData
  fieldErrors: CheckoutFormErrors
  submitError: string
  isSubmitting?: boolean
  isMember?: boolean
  loadedDefaultAddress?: boolean
  saveAsDefault?: boolean
  onSaveAsDefaultChange?: (checked: boolean) => void
  onOpenAddressPicker?: () => void
  hasSavedAddresses?: boolean
  coupons: MemberCoupon[]
  applicableCoupons: MemberCoupon[]
  productTotal: number
  couponDiscount: number
  shippingFee: number
  totalAmount: number
  canSubmit: boolean
  onChange: <K extends keyof CheckoutFormData>(field: K, value: CheckoutFormData[K]) => void
  onSubmit: () => void | Promise<void>
}

const labelClassName = 'mb-2 block text-sm font-semibold text-neutral-800 sm:text-base'
const sectionClassName = 'rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6'

function getInputClassName(hasError: boolean): string {
  return `w-full rounded-xl border px-4 py-3 text-base text-neutral-900 outline-none focus:border-neutral-500 ${
    hasError ? 'border-red-400 bg-red-50' : 'border-neutral-300'
  }`
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-2 text-sm text-red-600" role="alert">
      {message}
    </p>
  )
}

function SectionTitle({ step, title }: { step: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
        {step}
      </span>
      <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">{title}</h2>
    </div>
  )
}

export function CheckoutForm({
  form,
  fieldErrors,
  submitError,
  isSubmitting = false,
  isMember = false,
  loadedDefaultAddress = false,
  saveAsDefault = false,
  onSaveAsDefaultChange,
  onOpenAddressPicker,
  hasSavedAddresses = false,
  coupons,
  applicableCoupons,
  productTotal,
  couponDiscount,
  shippingFee,
  totalAmount,
  canSubmit,
  onChange,
  onSubmit,
}: CheckoutFormProps) {
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit()
      }}
    >
      <section className={sectionClassName}>
        <SectionTitle step="1" title="주문자 정보" />
        <div className="space-y-4">
          <div>
            <label htmlFor="customerName" className={labelClassName}>
              이름 <span className="text-red-600">*</span>
            </label>
            <input
              id="customerName"
              value={form.customerName}
              onChange={(e) => onChange('customerName', e.target.value)}
              className={getInputClassName(Boolean(fieldErrors.customerName))}
              placeholder="주문자 이름"
            />
            <FieldError message={fieldErrors.customerName} />
          </div>
          <div>
            <label htmlFor="customerPhone" className={labelClassName}>
              연락처 <span className="text-red-600">*</span>
            </label>
            <input
              id="customerPhone"
              type="tel"
              inputMode="numeric"
              value={form.customerPhone}
              onChange={(e) => onChange('customerPhone', e.target.value)}
              className={getInputClassName(Boolean(fieldErrors.customerPhone))}
              placeholder="01012345678"
            />
            <FieldError message={fieldErrors.customerPhone} />
          </div>
          <div>
            <label htmlFor="customerEmail" className={labelClassName}>
              이메일
            </label>
            <input
              id="customerEmail"
              type="email"
              value={form.customerEmail}
              onChange={(e) => onChange('customerEmail', e.target.value)}
              className={getInputClassName(Boolean(fieldErrors.customerEmail))}
              placeholder="order@example.com"
            />
            <FieldError message={fieldErrors.customerEmail} />
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <SectionTitle step="2" title="배송지 정보" />
          {isMember && hasSavedAddresses && onOpenAddressPicker ? (
            <button
              type="button"
              onClick={onOpenAddressPicker}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              다른 배송지 선택
            </button>
          ) : null}
        </div>

        {loadedDefaultAddress ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            기본 배송지를 불러왔습니다.
          </p>
        ) : null}

        <label className="mb-4 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={form.sameAsOrdererForRecipient}
            onChange={(e) => onChange('sameAsOrdererForRecipient', e.target.checked)}
            className="mt-0.5"
          />
          <span>받는 분 정보가 주문자와 동일합니다</span>
        </label>

        <div className="space-y-4">
          {!form.sameAsOrdererForRecipient ? (
            <>
              <div>
                <label htmlFor="recipientName" className={labelClassName}>
                  받는 분 <span className="text-red-600">*</span>
                </label>
                <input
                  id="recipientName"
                  value={form.recipientName}
                  onChange={(e) => onChange('recipientName', e.target.value)}
                  className={getInputClassName(Boolean(fieldErrors.recipientName))}
                />
                <FieldError message={fieldErrors.recipientName} />
              </div>
              <div>
                <label htmlFor="recipientPhone" className={labelClassName}>
                  받는 분 연락처 <span className="text-red-600">*</span>
                </label>
                <input
                  id="recipientPhone"
                  type="tel"
                  inputMode="numeric"
                  value={form.recipientPhone}
                  onChange={(e) => onChange('recipientPhone', e.target.value)}
                  className={getInputClassName(Boolean(fieldErrors.recipientPhone))}
                />
                <FieldError message={fieldErrors.recipientPhone} />
              </div>
            </>
          ) : null}

          <AddressSearchFields
            variant="checkout"
            postalCode={form.postalCode}
            address={form.address}
            addressDetail={form.addressDetail}
            onPostalCodeChange={(value) => onChange('postalCode', value)}
            onAddressChange={(value) => onChange('address', value)}
            onAddressDetailChange={(value) => onChange('addressDetail', value)}
            fieldErrors={{
              postalCode: fieldErrors.postalCode,
              address: fieldErrors.address,
              addressDetail: fieldErrors.addressDetail,
            }}
            disabled={isSubmitting}
          />
          <div>
            <label htmlFor="memo" className={labelClassName}>
              배송메모
            </label>
            <textarea
              id="memo"
              value={form.memo}
              onChange={(e) => onChange('memo', e.target.value)}
              className={`${getInputClassName(Boolean(fieldErrors.memo))} min-h-24 resize-y`}
              maxLength={100}
            />
            <FieldError message={fieldErrors.memo} />
          </div>

          {isMember && onSaveAsDefaultChange ? (
            <label className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => onSaveAsDefaultChange(e.target.checked)}
                className="mt-0.5"
              />
              <span>기본 배송지로 저장</span>
            </label>
          ) : null}
        </div>
      </section>

      <CheckoutCouponSection
        isMember={isMember}
        coupons={coupons}
        applicableCoupons={applicableCoupons}
        selectedCouponId={form.selectedCouponId}
        productTotal={productTotal}
        onSelectCoupon={(couponId) => onChange('selectedCouponId', couponId)}
      />

      <section className={sectionClassName}>
        <SectionTitle step="4" title="입금자명" />
        <label className="mb-4 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={form.sameAsOrdererForDepositor}
            onChange={(e) => onChange('sameAsOrdererForDepositor', e.target.checked)}
            className="mt-0.5"
          />
          <span>입금자명이 주문자와 동일합니다</span>
        </label>
        {!form.sameAsOrdererForDepositor ? (
          <div>
            <label htmlFor="depositorName" className={labelClassName}>
              입금자명 <span className="text-red-600">*</span>
            </label>
            <input
              id="depositorName"
              value={form.depositorName}
              onChange={(e) => onChange('depositorName', e.target.value)}
              className={getInputClassName(Boolean(fieldErrors.depositorName))}
              placeholder="통장에 표시되는 이름"
            />
            <FieldError message={fieldErrors.depositorName} />
          </div>
        ) : (
          <p className="text-sm text-neutral-600">
            입금자명: <strong>{form.customerName || '주문자 이름 입력 후 자동 반영'}</strong>
          </p>
        )}
      </section>

      <section className={sectionClassName}>
        <SectionTitle step="5" title="결제 요약" />
        <dl className="space-y-3 text-sm sm:text-base">
          <div className="flex justify-between text-neutral-600">
            <dt>상품금액</dt>
            <dd className="font-semibold text-neutral-900">{formatPrice(productTotal)}</dd>
          </div>
          <div className="flex justify-between text-neutral-600">
            <dt>쿠폰 할인</dt>
            <dd className="font-semibold text-red-600">
              {couponDiscount > 0 ? `-${formatPrice(couponDiscount)}` : formatPrice(0)}
            </dd>
          </div>
          <ShippingFeeRow subtotal={productTotal} shippingFee={shippingFee} />
          <div className="flex justify-between border-t border-neutral-200 pt-3">
            <dt className="font-semibold text-neutral-900">최종 입금금액</dt>
            <dd className="text-xl font-bold text-neutral-900">{formatPrice(totalAmount)}</dd>
          </div>
        </dl>
      </section>

      <section className={sectionClassName}>
        <SectionTitle step="6" title="입금 계좌 안내" />
        <DepositAccountInfo description="" showCopyButton />
      </section>

      <section className={sectionClassName}>
        <SectionTitle step="7" title="주문 동의" />
        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={form.agreedOrder}
              onChange={(e) => onChange('agreedOrder', e.target.checked)}
              className="mt-0.5"
            />
            <span>주문 내용을 확인하였으며, 정보 제공에 동의합니다. (필수)</span>
          </label>
          <FieldError message={fieldErrors.agreedOrder} />
          <label className="flex items-start gap-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={form.agreedPrivacy}
              onChange={(e) => onChange('agreedPrivacy', e.target.checked)}
              className="mt-0.5"
            />
            <span>개인정보 수집·이용에 동의합니다. (필수)</span>
          </label>
          <FieldError message={fieldErrors.agreedPrivacy} />
        </div>
      </section>

      {submitError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !canSubmit}
        className="min-h-14 w-full rounded-xl bg-neutral-900 py-4 text-lg font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {isSubmitting ? '주문 접수 중...' : '무통장 입금 주문하기'}
      </button>
    </form>
  )
}
