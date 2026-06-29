import { sanitizePhone } from './sanitize'

export function formatPhoneDisplay(phone: string): string {
  const digits = sanitizePhone(phone)

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  return digits
}

export function maskPhoneNumber(phone: string): string {
  const digits = sanitizePhone(phone)

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-****`
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-****`
  }

  if (phone.length <= 4) {
    return '****'
  }

  return `${phone.slice(0, Math.max(0, phone.length - 4))}****`
}
