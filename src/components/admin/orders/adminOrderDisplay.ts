import { summarizeOrderItems } from '../../../services/adminOrderRepository'
import type { AdminOrderRow } from '../../../types/adminOrder'

export function displayOrderProductLabel(productLabel: string): string {
  return productLabel.replace(/ 외 (\d+)건$/, ' 외 $1개')
}

export function getOrderProductSummary(order: AdminOrderRow): {
  productLabel: string
  quantityLabel: string
  primaryProductSlug: string | null
} {
  const summary = summarizeOrderItems(order.order_items)
  const primaryProductSlug = order.order_items[0]?.product_slug ?? null

  return {
    productLabel: displayOrderProductLabel(summary.productLabel),
    quantityLabel: summary.quantityLabel,
    primaryProductSlug,
  }
}

export function formatAdminOrderDate(value: string): { date: string; time: string } {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: '' }
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  const hours = String(parsed.getHours()).padStart(2, '0')
  const minutes = String(parsed.getMinutes()).padStart(2, '0')

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  }
}
