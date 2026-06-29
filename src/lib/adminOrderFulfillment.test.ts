import { describe, expect, it } from 'vitest'
import {
  canConfirmPayment,
  canMarkDelivered,
  canMarkPreparing,
  canMarkShipping,
  canSaveShipping,
  getFulfillmentPanelGuidance,
  getMarkDeliveredState,
  getMarkShippingState,
  shouldShowSaveTrackingHint,
  validateMarkDelivered,
  validateMarkShipping,
  validateSaveShipping,
} from './adminOrderFulfillment'
import type { AdminOrderRow } from '../types/adminOrder'

function createOrder(
  overrides: Partial<AdminOrderRow> = {},
): Pick<AdminOrderRow, 'status' | 'payment_status' | 'courier' | 'tracking_number'> {
  return {
    status: 'pending_payment',
    payment_status: 'waiting_deposit',
    courier: null,
    tracking_number: null,
    ...overrides,
  }
}

describe('adminOrderFulfillment', () => {
  it('allows deposit confirmation only while waiting for payment', () => {
    expect(canConfirmPayment(createOrder())).toBe(true)
    expect(canConfirmPayment(createOrder({ status: 'payment_confirmed', payment_status: 'paid' }))).toBe(false)
  })

  it('requires paid status before shipping', () => {
    const error = validateMarkShipping(createOrder({ status: 'pending_payment' }), {
      courier: 'CJ대한통운',
      trackingNumber: '1234567890',
    })

    expect(error).toBe('입금 확인 후에만 배송중 처리할 수 있습니다.')
    expect(
      canMarkShipping(
        createOrder({ status: 'preparing', payment_status: 'paid' }),
        { courier: 'CJ대한통운', trackingNumber: '1234567890' },
      ),
    ).toBe(true)
  })

  it('requires tracking number before shipping', () => {
    const error = validateMarkShipping(
      createOrder({ status: 'preparing', payment_status: 'paid' }),
      { courier: 'CJ대한통운', trackingNumber: '   ' },
    )

    expect(error).toBe('운송장번호를 입력하거나 저장해주세요.')
  })

  it('allows delivered only from shipping with saved tracking', () => {
    expect(
      canMarkDelivered(
        createOrder({
          status: 'shipping',
          courier: 'CJ대한통운',
          tracking_number: '1234567890',
        }),
      ),
    ).toBe(true)

    expect(validateMarkDelivered(createOrder({ status: 'preparing' }))).toBe(
      '배송중 상태에서만 배송완료 처리할 수 있습니다. 택배사·운송장 저장 후 [배송중] 버튼을 먼저 눌러주세요.',
    )

    expect(
      getMarkDeliveredState(
        createOrder({
          status: 'preparing',
          courier: 'CJ대한통운',
          tracking_number: '1234567890',
        }),
      ).disabledReason,
    ).toContain('[배송중] 버튼')
  })

  it('requires saved tracking on order before delivered', () => {
    expect(
      validateMarkDelivered(createOrder({ status: 'shipping', courier: null, tracking_number: null })),
    ).toBe('택배사가 저장되지 않았습니다. 송장 정보를 먼저 저장해주세요.')
  })

  it('guides preparing state before shipping action', () => {
    expect(
      getMarkShippingState(createOrder({ status: 'payment_confirmed', payment_status: 'paid' }), {
        courier: 'CJ대한통운',
        trackingNumber: '1234567890',
      }).disabledReason,
    ).toContain('[배송준비]')
  })

  it('allows shipping when tracking already saved on order', () => {
    expect(
      canMarkShipping(
        createOrder({
          status: 'preparing',
          payment_status: 'paid',
          courier: 'CJ대한통운',
          tracking_number: '1234567890',
        }),
        { courier: '', trackingNumber: '' },
      ),
    ).toBe(true)
  })

  it('allows preparing when status is payment_confirmed even if payment_status column missing', () => {
    expect(
      canMarkPreparing(createOrder({ status: 'payment_confirmed', payment_status: 'waiting_deposit' })),
    ).toBe(true)
  })

  it('allows deposit confirmation for legacy pending status', () => {
    expect(canConfirmPayment(createOrder({ status: 'pending' as AdminOrderRow['status'] }))).toBe(true)
  })

  it('allows preparing only after payment confirmed', () => {
    expect(canMarkPreparing(createOrder({ status: 'payment_confirmed', payment_status: 'paid' }))).toBe(true)
    expect(canMarkPreparing(createOrder({ status: 'pending_payment' }))).toBe(false)
  })

  it('allows saving shipping info regardless of payment status when fields are filled', () => {
    const shipping = { courier: 'CJ대한통운', trackingNumber: '1234567890' }

    expect(canSaveShipping(createOrder({ status: 'pending_payment' }), shipping)).toBe(true)
    expect(
      canSaveShipping(createOrder({ status: 'preparing', payment_status: 'paid' }), shipping),
    ).toBe(true)
    expect(
      canSaveShipping(createOrder({ status: 'shipping', payment_status: 'paid' }), shipping),
    ).toBe(true)
    expect(canSaveShipping(createOrder({ status: 'pending_payment' }), shipping)).toBe(true)
    expect(validateSaveShipping(createOrder({ status: 'pending_payment' }), { courier: '', trackingNumber: '1' })).toBe(
      '택배사를 선택해주세요.',
    )
    expect(
      validateSaveShipping(createOrder({ status: 'pending_payment' }), {
        courier: 'CJ대한통운',
        trackingNumber: '   ',
      }),
    ).toBe('운송장번호를 입력해주세요.')
    expect(canSaveShipping(createOrder({ status: 'delivered' }), shipping)).toBe(false)
  })

  describe('getFulfillmentPanelGuidance', () => {
    it('shows a single terminal-state message for delivered orders', () => {
      const message = getFulfillmentPanelGuidance(
        createOrder({
          status: 'delivered',
          courier: 'CJ대한통운',
          tracking_number: '1234567890',
        }),
        { courier: 'CJ대한통운', trackingNumber: '1234567890' },
      )

      expect(message).toBe('이미 배송완료된 주문입니다. 송장 수정과 상태 변경은 더 이상 할 수 없습니다.')
    })

    it('shows a single terminal-state message for cancelled orders', () => {
      const message = getFulfillmentPanelGuidance(createOrder({ status: 'cancelled' }), {
        courier: '',
        trackingNumber: '',
      })

      expect(message).toBe('취소완료된 주문입니다. 송장 수정과 상태 변경은 더 이상 할 수 없습니다.')
    })

    it('does not repeat shipping guidance when order is already shipping and deliverable', () => {
      const message = getFulfillmentPanelGuidance(
        createOrder({
          status: 'shipping',
          payment_status: 'paid',
          courier: 'CJ대한통운',
          tracking_number: '1234567890',
        }),
        { courier: 'CJ대한통운', trackingNumber: '1234567890' },
      )

      expect(message).toBeNull()
    })

    it('hides save hint when terminal guidance already covers it', () => {
      const order = createOrder({ status: 'delivered' })
      const saveState = {
        courierSelected: true,
        trackingNumberExists: true,
        canSaveTracking: false,
        disabledReason: '완료·취소된 주문은 송장을 수정할 수 없습니다.',
      }
      const guidance = getFulfillmentPanelGuidance(order, { courier: 'CJ대한통운', trackingNumber: '1' })

      expect(shouldShowSaveTrackingHint(order, saveState, guidance)).toBe(false)
    })
  })
})
