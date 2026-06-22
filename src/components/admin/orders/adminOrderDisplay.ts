import { summarizeOrderItems } from '../../../services/adminOrderRepository'
import type { AdminOrderRow } from '../../../types/adminOrder'

export function displayOrderProductLabel(productLabel: string): string {
  return productLabel.replace(/ 외 (\d+)건$/, ' 외 $1개')
}

export function getOrderProductSummary(order: AdminOrderRow): {
  productLabel: string
  quantityLabel: string
} {
  const summary = summarizeOrderItems(order.order_items)

  return {
    productLabel: displayOrderProductLabel(summary.productLabel),
    quantityLabel: summary.quantityLabel,
  }
}
