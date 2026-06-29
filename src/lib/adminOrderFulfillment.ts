import { normalizeOrderStatus } from './adminOrderStatus'
import type { AdminOrderRow, DbOrderStatus } from '../types/adminOrder'

export const COURIER_OPTIONS = [
  { value: 'CJ대한통운', label: 'CJ대한통운' },
  { value: '한진택배', label: '한진택배' },
  { value: '롯데택배', label: '롯데택배' },
  { value: '우체국택배', label: '우체국택배' },
  { value: '로젠택배', label: '로젠택배' },
  { value: '기타', label: '기타' },
] as const

export type CourierValue = (typeof COURIER_OPTIONS)[number]['value']

export interface OrderShippingInput {
  courier: string
  trackingNumber: string
}

export type AdminOrderFulfillmentAction =
  | 'confirm_payment'
  | 'mark_preparing'
  | 'mark_shipping'
  | 'mark_delivered'
  | 'cancel'

export function getNormalizedOrderStatus(order: Pick<AdminOrderRow, 'status'>): DbOrderStatus {
  return normalizeOrderStatus(order.status)
}

export function isPaymentConfirmed(order: Pick<AdminOrderRow, 'status' | 'payment_status'>): boolean {
  if (order.payment_status === 'paid') {
    return true
  }

  const status = getNormalizedOrderStatus(order)
  return (
    status === 'payment_confirmed' ||
    status === 'preparing' ||
    status === 'shipping' ||
    status === 'delivered'
  )
}

export function canConfirmPayment(order: Pick<AdminOrderRow, 'status' | 'payment_status'>): boolean {
  const status = getNormalizedOrderStatus(order)
  return status === 'pending_payment' && order.payment_status !== 'paid'
}

export function canMarkPreparing(order: Pick<AdminOrderRow, 'status' | 'payment_status'>): boolean {
  return getNormalizedOrderStatus(order) === 'payment_confirmed'
}

export function resolveOrderShipping(
  order: Pick<AdminOrderRow, 'courier' | 'tracking_number'>,
  shipping: OrderShippingInput,
): OrderShippingInput {
  return {
    courier: shipping.courier.trim() || order.courier?.trim() || '',
    trackingNumber: shipping.trackingNumber.trim() || order.tracking_number?.trim() || '',
  }
}

export interface FulfillmentActionState {
  canPerform: boolean
  disabledReason: string | null
}

export function getMarkShippingState(
  order: Pick<AdminOrderRow, 'status' | 'payment_status' | 'courier' | 'tracking_number'>,
  shipping: OrderShippingInput,
): FulfillmentActionState {
  const status = getNormalizedOrderStatus(order)
  const resolvedShipping = resolveOrderShipping(order, shipping)

  if (status === 'shipping' || status === 'delivered') {
    return {
      canPerform: false,
      disabledReason:
        status === 'delivered'
          ? '이미 배송완료된 주문입니다.'
          : '이미 배송중 상태입니다.',
    }
  }

  if (status === 'cancelled' || status === 'cancel_requested') {
    return { canPerform: false, disabledReason: '취소된 주문은 배송중 처리할 수 없습니다.' }
  }

  if (!isPaymentConfirmed(order)) {
    return {
      canPerform: false,
      disabledReason: '입금 확인 후에만 배송중 처리할 수 있습니다.',
    }
  }

  if (status === 'pending_payment') {
    return {
      canPerform: false,
      disabledReason: '입금 확인 후에만 배송중 처리할 수 있습니다.',
    }
  }

  if (status === 'payment_confirmed') {
    return {
      canPerform: false,
      disabledReason: '배송준비 상태에서만 배송중 처리할 수 있습니다. [배송준비] 버튼을 먼저 눌러주세요.',
    }
  }

  if (status !== 'preparing') {
    return {
      canPerform: false,
      disabledReason: '배송준비 상태에서만 배송중 처리할 수 있습니다.',
    }
  }

  if (resolvedShipping.courier === '') {
    return { canPerform: false, disabledReason: '택배사를 선택해주세요.' }
  }

  if (resolvedShipping.trackingNumber === '') {
    return { canPerform: false, disabledReason: '운송장번호를 입력하거나 저장해주세요.' }
  }

  return { canPerform: true, disabledReason: null }
}

export function canMarkShipping(
  order: Pick<AdminOrderRow, 'status' | 'payment_status' | 'courier' | 'tracking_number'>,
  shipping: OrderShippingInput,
): boolean {
  return getMarkShippingState(order, shipping).canPerform
}

export interface SaveTrackingState {
  courierSelected: boolean
  trackingNumberExists: boolean
  canSaveTracking: boolean
  disabledReason: string | null
}

export function getSaveTrackingState(
  order: Pick<AdminOrderRow, 'status'>,
  shipping: OrderShippingInput,
): SaveTrackingState {
  const status = getNormalizedOrderStatus(order)
  const courierSelected = shipping.courier.trim() !== ''
  const trackingNumberExists = shipping.trackingNumber.trim() !== ''

  if (status === 'delivered' || status === 'cancelled' || status === 'cancel_requested') {
    return {
      courierSelected,
      trackingNumberExists,
      canSaveTracking: false,
      disabledReason: '완료·취소된 주문은 송장을 수정할 수 없습니다.',
    }
  }

  if (!courierSelected) {
    return {
      courierSelected,
      trackingNumberExists,
      canSaveTracking: false,
      disabledReason: '택배사를 선택해주세요.',
    }
  }

  if (!trackingNumberExists) {
    return {
      courierSelected,
      trackingNumberExists,
      canSaveTracking: false,
      disabledReason: '운송장번호를 입력해주세요.',
    }
  }

  return {
    courierSelected,
    trackingNumberExists,
    canSaveTracking: true,
    disabledReason: null,
  }
}

export function canSaveShipping(
  order: Pick<AdminOrderRow, 'status'>,
  shipping: OrderShippingInput,
): boolean {
  return getSaveTrackingState(order, shipping).canSaveTracking
}

export function validateSaveShipping(
  order: Pick<AdminOrderRow, 'status'>,
  shipping: OrderShippingInput,
): string | null {
  return getSaveTrackingState(order, shipping).disabledReason
}

export function getMarkDeliveredState(
  order: Pick<AdminOrderRow, 'status' | 'courier' | 'tracking_number'>,
): FulfillmentActionState {
  const status = getNormalizedOrderStatus(order)

  if (status === 'delivered') {
    return { canPerform: false, disabledReason: '이미 배송완료된 주문입니다.' }
  }

  if (status === 'cancelled' || status === 'cancel_requested') {
    return { canPerform: false, disabledReason: '취소된 주문은 배송완료 처리할 수 없습니다.' }
  }

  if (status === 'pending_payment' || status === 'payment_confirmed') {
    return {
      canPerform: false,
      disabledReason: '입금 확인 및 배송준비 후 [배송중] 처리를 먼저 진행해주세요.',
    }
  }

  if (status === 'preparing') {
    const hasSavedTracking = Boolean(order.courier?.trim() && order.tracking_number?.trim())
    if (hasSavedTracking) {
      return {
        canPerform: false,
        disabledReason:
          '송장이 저장되었습니다. [배송중] 버튼을 눌러 배송을 시작한 뒤 배송완료 처리할 수 있습니다.',
      }
    }

    return {
      canPerform: false,
      disabledReason:
        '배송중 상태에서만 배송완료 처리할 수 있습니다. 택배사·운송장 저장 후 [배송중] 버튼을 먼저 눌러주세요.',
    }
  }

  if (status !== 'shipping') {
    return {
      canPerform: false,
      disabledReason: '배송중 상태에서만 배송완료 처리할 수 있습니다.',
    }
  }

  if (!order.courier?.trim()) {
    return {
      canPerform: false,
      disabledReason: '택배사가 저장되지 않았습니다. 송장 정보를 먼저 저장해주세요.',
    }
  }

  if (!order.tracking_number?.trim()) {
    return {
      canPerform: false,
      disabledReason: '운송장번호가 저장되지 않았습니다. 송장 정보를 먼저 저장해주세요.',
    }
  }

  return { canPerform: true, disabledReason: null }
}

export function canMarkDelivered(
  order: Pick<AdminOrderRow, 'status' | 'courier' | 'tracking_number'>,
): boolean {
  return getMarkDeliveredState(order).canPerform
}

export function canCancelOrder(order: Pick<AdminOrderRow, 'status'>): boolean {
  const status = getNormalizedOrderStatus(order)
  return status !== 'delivered' && status !== 'cancelled' && status !== 'cancel_requested'
}

export function validateMarkShipping(
  order: Pick<AdminOrderRow, 'status' | 'payment_status' | 'courier' | 'tracking_number'>,
  shipping: OrderShippingInput,
): string | null {
  return getMarkShippingState(order, shipping).disabledReason
}

export function validateMarkDelivered(
  order: Pick<AdminOrderRow, 'status' | 'courier' | 'tracking_number'>,
): string | null {
  return getMarkDeliveredState(order).disabledReason
}

export function getFulfillmentPanelGuidance(
  order: Pick<AdminOrderRow, 'status' | 'payment_status' | 'courier' | 'tracking_number'>,
  shipping: OrderShippingInput,
): string | null {
  const status = getNormalizedOrderStatus(order)

  if (status === 'delivered') {
    return '이미 배송완료된 주문입니다. 송장 수정과 상태 변경은 더 이상 할 수 없습니다.'
  }

  if (status === 'cancelled') {
    return '취소완료된 주문입니다. 송장 수정과 상태 변경은 더 이상 할 수 없습니다.'
  }

  if (status === 'cancel_requested') {
    return '취소 요청된 주문입니다. 송장 수정과 상태 변경은 더 이상 할 수 없습니다.'
  }

  const markDeliveredState = getMarkDeliveredState(order)
  if (!markDeliveredState.canPerform && markDeliveredState.disabledReason) {
    return markDeliveredState.disabledReason
  }

  const markShippingState = getMarkShippingState(order, shipping)
  if (!markShippingState.canPerform && markShippingState.disabledReason) {
    if (status === 'shipping') {
      return null
    }
    return markShippingState.disabledReason
  }

  return null
}

export function shouldShowSaveTrackingHint(
  order: Pick<AdminOrderRow, 'status'>,
  saveTrackingState: SaveTrackingState,
  panelGuidance: string | null,
): boolean {
  if (saveTrackingState.canSaveTracking || !saveTrackingState.disabledReason) {
    return false
  }

  const status = getNormalizedOrderStatus(order)
  if (status === 'delivered' || status === 'cancelled' || status === 'cancel_requested') {
    return false
  }

  if (panelGuidance === saveTrackingState.disabledReason) {
    return false
  }

  return true
}

export function buildTrackingUrl(courier: string, trackingNumber: string): string | null {
  const number = trackingNumber.replace(/\s/g, '')
  if (!number) {
    return null
  }

  switch (courier) {
    case 'CJ대한통운':
      return `https://trace.cjlogistics.com/web/detail.jsp?slipno=${encodeURIComponent(number)}`
    case '한진택배':
      return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText=${encodeURIComponent(number)}`
    case '롯데택배':
      return `https://www.lotteglogis.com/open/tracking?invno=${encodeURIComponent(number)}`
    case '우체국택배':
      return `https://service.epost.go.kr/trace.RetrieveDomRi498.comm?sid1=${encodeURIComponent(number)}`
    case '로젠택배':
      return `https://www.ilogen.com/web/personal/trace/${encodeURIComponent(number)}`
    default:
      return null
  }
}

export function formatTrackingDisplay(courier: string | null, trackingNumber: string | null): string {
  if (!courier && !trackingNumber) {
    return '-'
  }

  if (courier && trackingNumber) {
    return `${courier} ${trackingNumber}`
  }

  return courier ?? trackingNumber ?? '-'
}
