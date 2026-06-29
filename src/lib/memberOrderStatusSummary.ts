import { normalizeOrderStatus } from './adminOrderStatus'
import type { MemberOrderSummary, MemberOrderStatusSummary } from '../types/mypage'

export const MEMBER_ORDER_STATUS_SUMMARY_ITEMS = [
  { key: 'waitingPayment', label: '입금대기' },
  { key: 'preparing', label: '배송준비' },
  { key: 'shipping', label: '배송중' },
  { key: 'completed', label: '배송완료' },
] as const satisfies ReadonlyArray<{
  key: keyof MemberOrderStatusSummary
  label: string
}>

const EMPTY_SUMMARY: MemberOrderStatusSummary = {
  waitingPayment: 0,
  preparing: 0,
  shipping: 0,
  completed: 0,
}

export function summarizeMemberOrderStatuses(
  orders: MemberOrderSummary[],
): MemberOrderStatusSummary {
  return orders.reduce<MemberOrderStatusSummary>((summary, order) => {
    switch (normalizeOrderStatus(order.status)) {
      case 'pending_payment':
        summary.waitingPayment += 1
        break
      case 'payment_confirmed':
      case 'preparing':
        summary.preparing += 1
        break
      case 'shipping':
        summary.shipping += 1
        break
      case 'delivered':
        summary.completed += 1
        break
      default:
        break
    }

    return summary
  }, { ...EMPTY_SUMMARY })
}
