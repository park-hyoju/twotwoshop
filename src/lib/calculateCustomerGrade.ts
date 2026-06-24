import type { CustomerGrade } from '../types/adminCustomer'

const LOYAL_THRESHOLD = 300_000
const VIP_THRESHOLD = 500_000

export function calculateCustomerGrade(totalPurchaseAmount: number): CustomerGrade {
  if (totalPurchaseAmount >= VIP_THRESHOLD) {
    return 'vip'
  }

  if (totalPurchaseAmount >= LOYAL_THRESHOLD) {
    return 'loyal'
  }

  return 'regular'
}
