import { Link } from 'react-router-dom'
import type { CustomerAddress } from '../../types/mypage'
import { ROUTES } from '../../lib/routes'

interface CheckoutAddressPickerProps {
  addresses: CustomerAddress[]
  selectedAddressId: string | null
  onSelect: (address: CustomerAddress) => void
  onClose: () => void
}

export function CheckoutAddressPicker({
  addresses,
  selectedAddressId,
  onSelect,
  onClose,
}: CheckoutAddressPickerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-address-picker-title"
        className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 id="checkout-address-picker-title" className="text-lg font-bold text-neutral-900">
            배송지 선택
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            닫기
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-neutral-600">저장된 배송지가 없습니다.</p>
            <Link
              to={ROUTES.mypageAddresses}
              className="mt-4 inline-flex rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={onClose}
            >
              배송지 관리
            </Link>
          </div>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto p-3">
            {addresses.map((address) => (
              <li key={address.id}>
                <button
                  type="button"
                  onClick={() => onSelect(address)}
                  className={`mb-2 w-full rounded-xl border px-4 py-4 text-left transition-colors ${
                    selectedAddressId === address.id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">{address.label}</span>
                    {address.isDefault ? (
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white">
                        기본
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-neutral-800">
                    {address.recipientName} · {address.phone}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    ({address.zipcode}) {address.address1} {address.address2 ?? ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
