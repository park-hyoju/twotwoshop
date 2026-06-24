import { formatDateTime } from '../../../lib/formatDateTime'
import { formatPrice } from '../../../lib/formatPrice'
import type { AdminCustomerRow } from '../../../types/adminCustomer'
import { OrderStatusBadge } from '../orders/OrderStatusBadge'
import {
  CustomerGradeBadge,
  CustomerMemberBadge,
  CustomerStatusBadge,
} from './CustomerBadges'

interface AdminCustomersListProps {
  customers: AdminCustomerRow[]
  onCustomerClick: (customer: AdminCustomerRow) => void
}

export function AdminCustomersList({ customers, onCustomerClick }: AdminCustomersListProps) {
  return (
    <>
      <div className="space-y-2 md:hidden">
        {customers.map((customer) => (
          <article
            key={customer.groupKey}
            className="cursor-pointer rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            onClick={() => onCustomerClick(customer)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onCustomerClick(customer)
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-neutral-900">{customer.name}</p>
              <CustomerMemberBadge memberType={customer.memberType} />
            </div>
            <p className="mt-1 text-sm text-neutral-600">{customer.phone}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <CustomerGradeBadge grade={customer.grade} />
              <CustomerStatusBadge status={customer.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
              <div>
                <p className="text-neutral-500">주문횟수</p>
                <p className="font-medium text-neutral-800">{customer.orderCount}회</p>
              </div>
              <div>
                <p className="text-neutral-500">총 구매금액</p>
                <p className="font-medium text-neutral-800">
                  {formatPrice(customer.totalPurchaseAmount)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-neutral-500">{formatDateTime(customer.lastOrderAt)}</p>
              <OrderStatusBadge status={customer.lastOrderStatus} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 overflow-auto rounded-lg border border-neutral-200 bg-white md:block">
        <table className="min-w-[1080px] w-full table-fixed">
          <thead className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="w-[6.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                고객명
              </th>
              <th className="w-[7.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                연락처
              </th>
              <th className="w-[4.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                가입유형
              </th>
              <th className="w-[4rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                등급
              </th>
              <th className="w-[4rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                상태
              </th>
              <th className="w-[4.5rem] px-3 py-2.5 text-right text-xs font-semibold text-neutral-600">
                주문횟수
              </th>
              <th className="w-[6.5rem] px-3 py-2.5 text-right text-xs font-semibold text-neutral-600">
                총 구매금액
              </th>
              <th className="w-[8rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                최근 주문일
              </th>
              <th className="w-[5.5rem] px-3 py-2.5 text-left text-xs font-semibold text-neutral-600">
                최근 주문상태
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {customers.map((customer) => (
              <tr
                key={customer.groupKey}
                className="cursor-pointer text-sm text-neutral-800 transition-colors hover:bg-neutral-50"
                onClick={() => onCustomerClick(customer)}
              >
                <td className="px-3 py-2.5 font-medium text-neutral-900">{customer.name}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{customer.phone}</td>
                <td className="px-3 py-2.5">
                  <CustomerMemberBadge memberType={customer.memberType} />
                </td>
                <td className="px-3 py-2.5">
                  <CustomerGradeBadge grade={customer.grade} />
                </td>
                <td className="px-3 py-2.5">
                  <CustomerStatusBadge status={customer.status} />
                </td>
                <td className="px-3 py-2.5 text-right">{customer.orderCount.toLocaleString('ko-KR')}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-neutral-900">
                  {formatPrice(customer.totalPurchaseAmount)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-xs text-neutral-600">
                  {formatDateTime(customer.lastOrderAt)}
                </td>
                <td className="px-3 py-2.5">
                  <OrderStatusBadge status={customer.lastOrderStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
