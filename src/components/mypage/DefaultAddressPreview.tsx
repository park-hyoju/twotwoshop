import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { ROUTES } from '../../lib/routes'
import type { CustomerAddress } from '../../types/mypage'

interface DefaultAddressPreviewProps {
  address: CustomerAddress | null
}

export function DefaultAddressPreview({ address }: DefaultAddressPreviewProps) {
  return (
    <section
      aria-label="기본 배송지"
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          <MapPin className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">기본 배송지</h2>
          {address ? (
            <div className="mt-3 space-y-1 text-sm text-neutral-700">
              <p className="font-medium text-neutral-900">
                {address.label} · {address.recipientName}
              </p>
              <p>{address.phone}</p>
              <p className="leading-relaxed">
                ({address.zipcode}) {address.address1}
                {address.address2 ? ` ${address.address2}` : ''}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">기본 배송지를 등록해주세요.</p>
          )}
        </div>
      </div>

      <Link
        to={ROUTES.mypageAddresses}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
      >
        배송지 관리
      </Link>
    </section>
  )
}
