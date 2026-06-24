import { useEffect, useState, type FormEvent } from 'react'
import { formatDateTime } from '../../../lib/formatDateTime'
import { formatPrice } from '../../../lib/formatPrice'
import { CUSTOMER_STATUS_LABELS } from '../../../lib/adminCustomerDisplay'
import type { AdminCustomerDetail, CustomerStatus } from '../../../types/adminCustomer'
import { OrderStatusBadge } from '../orders/OrderStatusBadge'
import {
  CustomerGradeBadge,
  CustomerMemberBadge,
  CustomerStatusBadge,
} from './CustomerBadges'

interface AdminCustomerDetailModalProps {
  customer: AdminCustomerDetail | null
  isOpen: boolean
  isSubmitting: boolean
  errorMessage: string | null
  onClose: () => void
  onSave: (input: { adminNote: string; customerStatus: CustomerStatus }) => void
}

const inputClassName =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500'

const STATUS_OPTIONS: Array<{ value: CustomerStatus; label: string }> = [
  { value: 'normal', label: CUSTOMER_STATUS_LABELS.normal },
  { value: 'caution', label: CUSTOMER_STATUS_LABELS.caution },
  { value: 'blocked', label: CUSTOMER_STATUS_LABELS.blocked },
]

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-2 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-900">{value}</dd>
    </div>
  )
}

export function AdminCustomerDetailModal({
  customer,
  isOpen,
  isSubmitting,
  errorMessage,
  onClose,
  onSave,
}: AdminCustomerDetailModalProps) {
  const [adminNote, setAdminNote] = useState('')
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus>('normal')

  useEffect(() => {
    if (!isOpen || !customer) {
      return
    }

    setAdminNote(customer.adminNote ?? '')
    setCustomerStatus(customer.status)
  }, [customer, isOpen])

  if (!isOpen || !customer) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ adminNote, customerStatus })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-customer-detail-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="admin-customer-detail-title" className="text-xl font-bold text-neutral-900">
              {customer.name}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{customer.phone}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            닫기
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <CustomerMemberBadge memberType={customer.memberType} />
          <CustomerGradeBadge grade={customer.grade} />
          <CustomerStatusBadge status={customer.status} />
        </div>

        <section className="mt-6 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">기본 정보</h3>
          <dl className="space-y-2">
            <InfoRow label="이메일" value={customer.email ?? '-'} />
            <InfoRow label="배송지" value={customer.shippingAddress ?? '-'} />
            <InfoRow label="첫 주문일" value={formatDateTime(customer.firstOrderAt)} />
            <InfoRow label="최근 주문일" value={formatDateTime(customer.lastOrderAt)} />
            <InfoRow label="주문횟수" value={`${customer.orderCount}회`} />
            <InfoRow label="총 구매금액" value={formatPrice(customer.totalPurchaseAmount)} />
          </dl>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-neutral-900">주문 내역</h3>
          {customer.orders.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">주문 내역이 없습니다.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200">
              <table className="min-w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">
                      주문번호
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">
                      주문일
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">
                      상품명
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-600">
                      주문금액
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">
                      주문상태
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {customer.orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-3 py-2 font-medium text-neutral-900">{order.orderNumber}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-neutral-600">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="max-w-[12rem] truncate px-3 py-2 text-neutral-700" title={order.productLabel}>
                        {order.productLabel}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-neutral-900">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-3 py-2">
                        <OrderStatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-neutral-200 pt-6">
          <div>
            <label htmlFor="admin-customer-note" className="mb-2 block text-sm font-medium text-neutral-700">
              관리자 메모
            </label>
            <textarea
              id="admin-customer-note"
              rows={4}
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="고객 응대 메모를 입력하세요."
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="admin-customer-status" className="mb-2 block text-sm font-medium text-neutral-700">
              고객 상태
            </label>
            <select
              id="admin-customer-status"
              value={customerStatus}
              onChange={(event) => setCustomerStatus(event.target.value as CustomerStatus)}
              className={inputClassName}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
