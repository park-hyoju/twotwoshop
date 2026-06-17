import type { CheckoutFormData, CheckoutFormErrors } from '../../types/order'

interface CheckoutFormProps {
  form: CheckoutFormData
  fieldErrors: CheckoutFormErrors
  submitError: string
  isSubmitting?: boolean
  onChange: (field: keyof CheckoutFormData, value: string) => void
  onSubmit: () => void | Promise<void>
}

const labelClassName = 'mb-2 block text-base font-semibold text-neutral-800 sm:text-lg'

function getInputClassName(hasError: boolean): string {
  return `w-full rounded-xl border px-4 py-3 text-base text-neutral-900 outline-none focus:border-neutral-500 sm:text-lg ${
    hasError ? 'border-red-400 bg-red-50' : 'border-neutral-300'
  }`
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p className="mt-2 text-sm text-red-600 sm:text-base" role="alert">
      {message}
    </p>
  )
}

export function CheckoutForm({
  form,
  fieldErrors,
  submitError,
  isSubmitting = false,
  onChange,
  onSubmit,
}: CheckoutFormProps) {
  return (
    <form
      className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit()
      }}
    >
      <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">배송 정보</h2>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="customerName" className={labelClassName}>
            주문자 이름 <span className="text-red-600">*</span>
          </label>
          <input
            id="customerName"
            type="text"
            value={form.customerName}
            onChange={(event) => onChange('customerName', event.target.value)}
            className={getInputClassName(Boolean(fieldErrors.customerName))}
            placeholder="이름을 입력해주세요"
          />
          <FieldError message={fieldErrors.customerName} />
        </div>

        <div>
          <label htmlFor="phone" className={labelClassName}>
            연락처 <span className="text-red-600">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={form.phone}
            onChange={(event) => onChange('phone', event.target.value)}
            className={getInputClassName(Boolean(fieldErrors.phone))}
            placeholder="01012345678"
          />
          <FieldError message={fieldErrors.phone} />
        </div>

        <div>
          <label htmlFor="postalCode" className={labelClassName}>
            우편번호 <span className="text-red-600">*</span>
          </label>
          <input
            id="postalCode"
            type="text"
            inputMode="numeric"
            value={form.postalCode}
            onChange={(event) => onChange('postalCode', event.target.value)}
            className={getInputClassName(Boolean(fieldErrors.postalCode))}
            placeholder="12345"
          />
          <FieldError message={fieldErrors.postalCode} />
        </div>

        <div>
          <label htmlFor="address" className={labelClassName}>
            기본주소 <span className="text-red-600">*</span>
          </label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(event) => onChange('address', event.target.value)}
            className={getInputClassName(Boolean(fieldErrors.address))}
            placeholder="시/군/구, 도로명 주소"
          />
          <FieldError message={fieldErrors.address} />
        </div>

        <div>
          <label htmlFor="addressDetail" className={labelClassName}>
            상세주소 <span className="text-red-600">*</span>
          </label>
          <input
            id="addressDetail"
            type="text"
            value={form.addressDetail}
            onChange={(event) => onChange('addressDetail', event.target.value)}
            className={getInputClassName(Boolean(fieldErrors.addressDetail))}
            placeholder="동/호수, 상세 주소"
          />
          <FieldError message={fieldErrors.addressDetail} />
        </div>

        <div>
          <label htmlFor="memo" className={labelClassName}>
            배송메모
          </label>
          <textarea
            id="memo"
            value={form.memo}
            onChange={(event) => onChange('memo', event.target.value)}
            className={`${getInputClassName(Boolean(fieldErrors.memo))} min-h-28 resize-y`}
            placeholder="배송 시 요청사항을 입력해주세요"
            maxLength={100}
          />
          <FieldError message={fieldErrors.memo} />
        </div>
      </div>

      {submitError && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-base font-semibold text-red-700 sm:text-lg"
        >
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 min-h-14 w-full rounded-xl bg-neutral-900 py-4 text-lg font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {isSubmitting ? '주문 접수 중...' : '주문 접수하기'}
      </button>
    </form>
  )
}
