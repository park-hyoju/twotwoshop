import { describe, expect, it } from 'vitest'
import {
  findMatchingAddress,
  mapAddressToCheckoutForm,
  mapCheckoutFormToAddressInput,
  pickDefaultCustomerAddress,
} from './checkoutAddress'
import { INITIAL_CHECKOUT_FORM } from '../types/order'
import type { CustomerAddress } from '../types/mypage'

function createAddress(overrides: Partial<CustomerAddress> = {}): CustomerAddress {
  return {
    id: 'addr-1',
    userId: 'user-1',
    label: '집',
    recipientName: '홍길동',
    phone: '01012345678',
    zipcode: '12345',
    address1: '서울시 강남구',
    address2: '101호',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('checkoutAddress', () => {
  it('maps customer_addresses columns to checkout form fields', () => {
    const mapped = mapAddressToCheckoutForm(createAddress(), INITIAL_CHECKOUT_FORM)

    expect(mapped.recipientName).toBe('홍길동')
    expect(mapped.recipientPhone).toBe('01012345678')
    expect(mapped.postalCode).toBe('12345')
    expect(mapped.address).toBe('서울시 강남구')
    expect(mapped.addressDetail).toBe('101호')
    expect(mapped.sameAsOrdererForRecipient).toBe(false)
  })

  it('maps checkout form fields to customer_addresses columns', () => {
    expect(
      mapCheckoutFormToAddressInput(
        {
          ...INITIAL_CHECKOUT_FORM,
          recipientName: '홍길동',
          recipientPhone: '01012345678',
          postalCode: '12345',
          address: '서울시 강남구',
          addressDetail: '101호',
        },
        true,
      ),
    ).toEqual({
      label: '집',
      recipientName: '홍길동',
      phone: '01012345678',
      zipcode: '12345',
      address1: '서울시 강남구',
      address2: '101호',
      isDefault: true,
    })
  })

  it('picks the most recently updated default address', () => {
    const selected = pickDefaultCustomerAddress([
      createAddress({ id: 'old', updatedAt: '2026-01-01T00:00:00.000Z' }),
      createAddress({ id: 'new', updatedAt: '2026-06-01T00:00:00.000Z' }),
      createAddress({ id: 'other', isDefault: false, updatedAt: '2026-12-01T00:00:00.000Z' }),
    ])

    expect(selected?.id).toBe('new')
  })

  it('returns null when no default address exists', () => {
    expect(
      pickDefaultCustomerAddress([
        createAddress({ isDefault: false }),
      ]),
    ).toBeNull()
  })

  it('finds matching saved address from checkout form', () => {
    const address = createAddress()
    const form = mapAddressToCheckoutForm(address, INITIAL_CHECKOUT_FORM)

    expect(findMatchingAddress([address], form)?.id).toBe('addr-1')
  })
})
