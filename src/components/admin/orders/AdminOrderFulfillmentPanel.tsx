import { useEffect, useState } from 'react'
import {
  canCancelOrder,
  canConfirmPayment,
  canMarkPreparing,
  COURIER_OPTIONS,
  formatTrackingDisplay,
  getFulfillmentPanelGuidance,
  getMarkDeliveredState,
  getMarkShippingState,
  getSaveTrackingState,
  shouldShowSaveTrackingHint,
} from '../../../lib/adminOrderFulfillment'
import { getOrderStatusLabel, getPaymentStatusLabel } from '../../../lib/adminOrderStatus'
import type { AdminOrderFulfillmentAction, AdminOrderRow } from '../../../types/adminOrder'
import { OrderStatusBadge } from './OrderStatusBadge'

interface AdminOrderFulfillmentPanelProps {
  order: AdminOrderRow
  isProcessing?: boolean
  errorMessage?: string | null
  onAction: (
    action: AdminOrderFulfillmentAction,
    shipping?: { courier: string; trackingNumber: string },
  ) => void | Promise<void>
  onSaveShipping?: (shipping: { courier: string; trackingNumber: string }) => void | Promise<void>
}

export function AdminOrderFulfillmentPanel({
  order,
  isProcessing = false,
  errorMessage = null,
  onAction,
  onSaveShipping,
}: AdminOrderFulfillmentPanelProps) {
  const [courier, setCourier] = useState(order.courier ?? '')
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '')

  useEffect(() => {
    setCourier(order.courier ?? '')
    setTrackingNumber(order.tracking_number ?? '')
  }, [order.id, order.courier, order.tracking_number])

  const shippingInput = { courier, trackingNumber }
  const saveTrackingState = getSaveTrackingState(order, shippingInput)
  const markShippingState = getMarkShippingState(order, shippingInput)
  const markDeliveredState = getMarkDeliveredState(order)
  const panelGuidance = getFulfillmentPanelGuidance(order, shippingInput)
  const showSaveTrackingHint = shouldShowSaveTrackingHint(order, saveTrackingState, panelGuidance)
  const isTrackingLocked =
    order.status === 'delivered' || order.status === 'cancelled' || order.status === 'cancel_requested'
  const isSaveDisabled = isProcessing || !saveTrackingState.canSaveTracking
  const isMarkShippingDisabled = isProcessing || !markShippingState.canPerform
  const isMarkDeliveredDisabled = isProcessing || !markDeliveredState.canPerform

  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-neutral-900">주문 처리</h3>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <span className="text-xs text-neutral-600">
            {getPaymentStatusLabel(order.payment_status)}
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs text-neutral-500">
        입금대기 → 입금확인 → 배송준비 → 배송중 → 배송완료
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-600">택배사</span>
          <select
            value={courier}
            disabled={isProcessing || isTrackingLocked}
            onChange={(event) => setCourier(event.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">택배사 선택</option>
            {COURIER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-neutral-600">운송장번호</span>
          <input
            type="text"
            value={trackingNumber}
            disabled={isProcessing || isTrackingLocked}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="숫자만 입력"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>
      </div>

      {(order.courier || order.tracking_number) && (
        <p className="mt-3 text-xs text-neutral-600">
          등록된 송장: {formatTrackingDisplay(order.courier, order.tracking_number)}
        </p>
      )}

      {onSaveShipping ? (
        <div className="mt-3">
          <button
            type="button"
            disabled={isSaveDisabled}
            onClick={() => void onSaveShipping(shippingInput)}
            className="inline-flex min-h-9 items-center rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {isProcessing ? '저장 중...' : '송장 저장'}
          </button>

          {showSaveTrackingHint ? (
            <p className="mt-2 text-xs font-medium text-amber-700">
              {saveTrackingState.disabledReason}
            </p>
          ) : !panelGuidance ? (
            <p className="mt-2 text-xs text-neutral-500">
              택배사와 운송장번호를 입력하면 바로 저장할 수 있습니다.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton
          label="입금확인"
          disabled={isProcessing || !canConfirmPayment(order)}
          onClick={() => void onAction('confirm_payment')}
        />
        <ActionButton
          label="배송준비"
          disabled={isProcessing || !canMarkPreparing(order)}
          onClick={() => void onAction('mark_preparing')}
        />
        <ActionButton
          label="배송중"
          disabled={isMarkShippingDisabled}
          onClick={() => void onAction('mark_shipping', shippingInput)}
        />
        <ActionButton
          label="배송완료"
          disabled={isMarkDeliveredDisabled}
          onClick={() => void onAction('mark_delivered')}
        />
        <ActionButton
          label="취소"
          tone="danger"
          disabled={isProcessing || !canCancelOrder(order)}
          onClick={() => void onAction('cancel')}
        />
      </div>

      {panelGuidance ? (
        <p className="mt-3 text-xs font-medium text-amber-700">{panelGuidance}</p>
      ) : null}

      <p className={`text-xs text-neutral-500 ${panelGuidance ? 'mt-2' : 'mt-3'}`}>
        현재 단계: {getOrderStatusLabel(order.status)}
      </p>

      {errorMessage ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </section>
  )
}

function ActionButton({
  label,
  disabled,
  tone = 'default',
  onClick,
}: {
  label: string
  disabled?: boolean
  tone?: 'default' | 'danger'
  onClick: () => void
}) {
  const className =
    tone === 'danger'
      ? 'border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:border-neutral-200 disabled:text-neutral-400'
      : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 disabled:border-neutral-200 disabled:text-neutral-400'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${className}`}
    >
      {label}
    </button>
  )
}
