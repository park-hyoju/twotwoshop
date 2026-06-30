import { useId, useRef, useState } from 'react'
import { DaumPostcodeLayer } from './DaumPostcodeLayer'
import type { SelectedAddress } from '../../lib/daumPostcode'

export interface AddressSearchFieldErrors {
  postalCode?: string
  address?: string
  addressDetail?: string
}

interface AddressSearchFieldsProps {
  postalCode: string
  address: string
  addressDetail: string
  onPostalCodeChange: (value: string) => void
  onAddressChange: (value: string) => void
  onAddressDetailChange: (value: string) => void
  fieldErrors?: AddressSearchFieldErrors
  disabled?: boolean
  variant?: 'checkout' | 'mypage'
  addressDetailRequired?: boolean
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p className="mt-2 text-sm text-red-600" role="alert">
      {message}
    </p>
  )
}

export function AddressSearchFields({
  postalCode,
  address,
  addressDetail,
  onPostalCodeChange,
  onAddressChange,
  onAddressDetailChange,
  fieldErrors,
  disabled = false,
  variant = 'checkout',
  addressDetailRequired = true,
}: AddressSearchFieldsProps) {
  const [isLayerOpen, setIsLayerOpen] = useState(false)
  const addressDetailRef = useRef<HTMLInputElement>(null)
  const addressDetailId = useId()

  const isCheckout = variant === 'checkout'

  const labelClassName = isCheckout
    ? 'mb-2 block text-sm font-semibold text-neutral-800 sm:text-base'
    : 'font-medium text-neutral-700'

  const inputClassName = isCheckout
    ? (hasError: boolean) =>
        `w-full rounded-xl border px-4 py-3 text-base text-neutral-900 outline-none focus:border-neutral-500 ${
          hasError ? 'border-red-400 bg-red-50' : 'border-neutral-300'
        }`
    : (hasError: boolean) =>
        `mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-neutral-400 ${
          hasError ? 'border-red-400 bg-red-50' : 'border-neutral-200'
        }`

  const readonlyInputClassName = isCheckout
    ? `${inputClassName(false)} bg-neutral-50 text-neutral-700`
    : `${inputClassName(false)} bg-neutral-50 text-neutral-700`

  function handleAddressSelected(selected: SelectedAddress) {
    onPostalCodeChange(selected.postalCode)
    onAddressChange(selected.address)
    window.setTimeout(() => {
      addressDetailRef.current?.focus()
    }, 0)
  }

  const searchButton = (
    <button
      type="button"
      onClick={() => setIsLayerOpen(true)}
      disabled={disabled}
      className={
        isCheckout
          ? 'min-h-12 shrink-0 rounded-xl border border-neutral-900 bg-white px-4 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50'
          : 'min-h-11 shrink-0 rounded-xl border border-neutral-900 bg-white px-4 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50'
      }
    >
      주소 찾기
    </button>
  )

  return (
    <>
      <div className={isCheckout ? 'space-y-4' : 'space-y-4'}>
        <div>
          {isCheckout ? (
            <label htmlFor="address-search-postal-code" className={labelClassName}>
              우편번호 <span className="text-red-600">*</span>
            </label>
          ) : (
            <span className={`block text-sm ${labelClassName}`}>우편번호</span>
          )}
          <div className={`flex gap-2 ${isCheckout ? '' : 'mt-1.5'}`}>
            <input
              id="address-search-postal-code"
              inputMode="numeric"
              value={postalCode}
              readOnly
              aria-readonly="true"
              placeholder="주소 찾기를 눌러주세요"
              className={readonlyInputClassName}
            />
            {searchButton}
          </div>
          <FieldError message={fieldErrors?.postalCode} />
        </div>

        <div>
          {isCheckout ? (
            <label htmlFor="address-search-address" className={labelClassName}>
              기본주소 <span className="text-red-600">*</span>
            </label>
          ) : (
            <span className={`block text-sm ${labelClassName}`}>기본주소</span>
          )}
          <input
            id="address-search-address"
            value={address}
            readOnly
            aria-readonly="true"
            placeholder="주소 찾기를 눌러주세요"
            className={isCheckout ? readonlyInputClassName : `${readonlyInputClassName} mt-1.5`}
          />
          <FieldError message={fieldErrors?.address} />
        </div>

        <div>
          {isCheckout ? (
            <label htmlFor={addressDetailId} className={labelClassName}>
              상세주소 {addressDetailRequired ? <span className="text-red-600">*</span> : null}
            </label>
          ) : (
            <label htmlFor={addressDetailId} className={`block text-sm ${labelClassName}`}>
              상세주소
            </label>
          )}
          <input
            id={addressDetailId}
            ref={addressDetailRef}
            value={addressDetail}
            onChange={(event) => onAddressDetailChange(event.target.value)}
            disabled={disabled}
            placeholder="동, 호수 등 상세주소를 입력해주세요"
            className={
              isCheckout
                ? inputClassName(Boolean(fieldErrors?.addressDetail))
                : inputClassName(Boolean(fieldErrors?.addressDetail))
            }
            required={addressDetailRequired}
          />
          <FieldError message={fieldErrors?.addressDetail} />
          <p className="mt-2 text-sm text-neutral-500">
            주소 찾기로 기본주소를 선택한 뒤, 상세주소만 직접 입력해주세요.
          </p>
        </div>
      </div>

      <DaumPostcodeLayer
        isOpen={isLayerOpen}
        onClose={() => setIsLayerOpen(false)}
        onComplete={handleAddressSelected}
      />
    </>
  )
}
