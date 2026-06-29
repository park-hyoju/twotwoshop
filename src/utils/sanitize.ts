import {
  DISPLAY_NAME_MAX_LENGTH,
  MAX_ADDRESS_DETAIL_LENGTH,
  MAX_ADDRESS_LABEL_LENGTH,
  MAX_ADDRESS_LINE_LENGTH,
  MAX_BANNER_BUTTON_TEXT_LENGTH,
  MAX_BANNER_DESCRIPTION_LENGTH,
  MAX_BANNER_TITLE_LENGTH,
  MAX_INQUIRY_MESSAGE_LENGTH,
  MAX_MEMO_LENGTH,
  MAX_NAME_LENGTH,
  MAX_NOTICE_CONTENT_LENGTH,
  MAX_NOTICE_TITLE_LENGTH,
  MAX_ORDER_REFERENCE_LENGTH,
  MAX_SEARCH_LENGTH,
  MAX_TEXT_LENGTH,
  USERNAME_MAX_LENGTH,
} from './constants'

const SCRIPT_TAG_PATTERN = /<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi
const HTML_TAG_PATTERN = /<[^>]*>/g

export function stripHtmlTags(value: string): string {
  return value.replace(SCRIPT_TAG_PATTERN, '').replace(HTML_TAG_PATTERN, '')
}

export function sanitizeText(
  value: string,
  options?: { maxLength?: number },
): string {
  const maxLength = options?.maxLength ?? MAX_TEXT_LENGTH
  return stripHtmlTags(value).trim().slice(0, maxLength)
}

export function sanitizeOptionalText(
  value: string,
  options?: { maxLength?: number },
): string | null {
  const sanitized = sanitizeText(value, options)
  return sanitized.length > 0 ? sanitized : null
}

export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

export function sanitizeZipcode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5)
}

export function sanitizeEmail(value: string): string {
  return sanitizeText(value, { maxLength: 254 }).toLowerCase()
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function sanitizeUsernameInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, USERNAME_MAX_LENGTH)
}

export function sanitizeSearchQuery(value: string): string {
  return sanitizeText(value, { maxLength: MAX_SEARCH_LENGTH })
}

export function sanitizeSlug(value: string): string {
  return sanitizeText(value, { maxLength: 120 })
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function parseInteger(value: string | number): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && Number.isFinite(value) ? value : null
  }

  const trimmed = value.trim()
  if (!trimmed || !/^-?\d+$/.test(trimmed)) {
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function parsePositiveInteger(value: string | number): number | null {
  const parsed = parseInteger(value)
  if (parsed === null || parsed <= 0) {
    return null
  }

  return parsed
}

export function parseNonNegativeInteger(value: string | number): number | null {
  const parsed = parseInteger(value)
  if (parsed === null || parsed < 0) {
    return null
  }

  return parsed
}

export function parsePrice(value: string | number): number | null {
  const parsed = parseInteger(value)
  if (parsed === null || parsed <= 0) {
    return null
  }

  return parsed
}

export function clampQuantity(quantity: number, stock: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return stock > 0 ? 1 : 0
  }

  if (stock <= 0) {
    return 0
  }

  return Math.max(1, Math.min(Math.trunc(quantity), stock))
}

export {
  MAX_MEMO_LENGTH,
  MAX_NAME_LENGTH,
  MAX_SEARCH_LENGTH,
  MAX_INQUIRY_MESSAGE_LENGTH,
  MAX_NOTICE_TITLE_LENGTH,
  MAX_NOTICE_CONTENT_LENGTH,
  MAX_BANNER_TITLE_LENGTH,
  MAX_BANNER_DESCRIPTION_LENGTH,
  MAX_BANNER_BUTTON_TEXT_LENGTH,
  MAX_ORDER_REFERENCE_LENGTH,
  MAX_ADDRESS_LABEL_LENGTH,
  MAX_ADDRESS_LINE_LENGTH,
  MAX_ADDRESS_DETAIL_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
}
