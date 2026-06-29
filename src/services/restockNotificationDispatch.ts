/**
 * 재입고 알림 발송 어댑터 (카카오/SMS 등).
 * 실제 연동은 이 모듈에서만 추가하면 됩니다.
 */
import type { AdminRestockNotificationRow } from '../types/restockNotification'

export interface RestockDispatchPayload {
  notificationId: string
  productId: string
  productName: string
  customerName: string | null
  phone: string | null
  email: string | null
  userId: string | null
}

export function toRestockDispatchPayload(
  row: AdminRestockNotificationRow,
): RestockDispatchPayload {
  return {
    notificationId: row.id,
    productId: row.product_id,
    productName: row.product_name,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    userId: row.user_id,
  }
}

/** 추후 카카오/SMS 연동 시 이 함수를 구현합니다. */
export async function dispatchRestockNotification(
  _payload: RestockDispatchPayload,
): Promise<void> {
  return Promise.resolve()
}
