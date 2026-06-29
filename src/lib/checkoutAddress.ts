import type { CheckoutFormData } from '../types/order'
import type { CustomerAddress, CustomerAddressInput } from '../types/mypage'

export function mapAddressToCheckoutForm(
  address: CustomerAddress,
  current: CheckoutFormData,
): CheckoutFormData {
  return {
    ...current,
    recipientName: address.recipientName,
    recipientPhone: address.phone,
    postalCode: address.zipcode,
    address: address.address1,
    addressDetail: address.address2 ?? '',
    sameAsOrdererForRecipient: false,
  }
}

export function mapCheckoutFormToAddressInput(
  form: CheckoutFormData,
  isDefault: boolean,
  label = '집',
): CustomerAddressInput {
  return {
    label,
    recipientName: form.recipientName,
    phone: form.recipientPhone,
    zipcode: form.postalCode,
    address1: form.address,
    address2: form.addressDetail,
    isDefault,
  }
}

export function pickDefaultCustomerAddress(addresses: CustomerAddress[]): CustomerAddress | null {
  const defaults = addresses
    .filter((address) => address.isDefault)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )

  return defaults[0] ?? null
}

export function isSameAddressForm(
  address: CustomerAddress,
  form: CheckoutFormData,
): boolean {
  return (
    address.recipientName.trim() === form.recipientName.trim() &&
    address.phone.trim() === form.recipientPhone.trim() &&
    address.zipcode.trim() === form.postalCode.trim() &&
    address.address1.trim() === form.address.trim() &&
    (address.address2 ?? '').trim() === form.addressDetail.trim()
  )
}

export function findMatchingAddress(
  addresses: CustomerAddress[],
  form: CheckoutFormData,
): CustomerAddress | null {
  return addresses.find((address) => isSameAddressForm(address, form)) ?? null
}

export function resolveDepositorName(form: CheckoutFormData): string {
  if (form.sameAsOrdererForDepositor) {
    return form.customerName.trim()
  }

  return form.depositorName.trim()
}

export function resolveRecipientFields(form: CheckoutFormData): {
  recipientName: string
  recipientPhone: string
} {
  if (form.sameAsOrdererForRecipient) {
    return {
      recipientName: form.customerName.trim(),
      recipientPhone: form.customerPhone.trim(),
    }
  }

  return {
    recipientName: form.recipientName.trim(),
    recipientPhone: form.recipientPhone.trim(),
  }
}

export function isCheckoutFormReady(form: CheckoutFormData): boolean {
  return form.agreedOrder && form.agreedPrivacy
}
