import {
  DEFAULT_PRODUCT_RETURN_INFO,
  DEFAULT_PRODUCT_SHIPPING_INFO,
  type ProductReturnInfo,
  type ProductShippingInfo,
} from '../types/productDetail'
import {
  SHIPPING_POLICY_ADDITIONAL_NOTES,
  SHIPPING_POLICY_FREE_DETAIL,
  SHIPPING_POLICY_PAID_DETAIL,
} from './orderConstants'

export interface StorePolicy {
  shipping: ProductShippingInfo
  returns: ProductReturnInfo
}

const STORAGE_KEY = 'twotwoshop-store-policy'

export const DEFAULT_STORE_POLICY: StorePolicy = {
  shipping: { ...DEFAULT_PRODUCT_SHIPPING_INFO },
  returns: { ...DEFAULT_PRODUCT_RETURN_INFO },
}

interface LegacyReturnInfo {
  exchange_period?: string
  return_address?: string
  notes?: string
  eligible_cases?: string
  ineligible_cases?: string
  shipping_fee_notes?: string
}

interface LegacyShippingInfo {
  shipping_fee?: string
  delivery_period?: string
  free_shipping_threshold?: string
  additional_notes?: string
}

function isLegacyShippingFeeCopy(value: string): boolean {
  const trimmed = value.trim()
  return (
    trimmed.includes('전 상품 배송비') ||
    trimmed === '4,000원' ||
    (trimmed.includes('4,000원') && !trimmed.includes('70,000원'))
  )
}

function migrateLegacyShippingInfo(shipping: LegacyShippingInfo): LegacyShippingInfo {
  const migrated: LegacyShippingInfo = { ...shipping }
  const fee = migrated.shipping_fee?.trim() ?? ''
  const threshold = migrated.free_shipping_threshold?.trim() ?? ''
  const notes = migrated.additional_notes?.trim() ?? ''

  if (!fee || isLegacyShippingFeeCopy(fee)) {
    migrated.shipping_fee = SHIPPING_POLICY_PAID_DETAIL
  }

  if (!threshold) {
    migrated.free_shipping_threshold = SHIPPING_POLICY_FREE_DETAIL
  }

  if (!notes || notes.includes('전 상품 배송비')) {
    migrated.additional_notes = SHIPPING_POLICY_ADDITIONAL_NOTES
  }

  return migrated
}

function normalizeShippingInfo(shipping: LegacyShippingInfo): ProductShippingInfo {
  const migrated = migrateLegacyShippingInfo(shipping)

  return {
    ...DEFAULT_STORE_POLICY.shipping,
    ...migrated,
    additional_notes:
      migrated.additional_notes?.trim() || DEFAULT_STORE_POLICY.shipping.additional_notes,
    free_shipping_threshold:
      migrated.free_shipping_threshold?.trim() ||
      DEFAULT_STORE_POLICY.shipping.free_shipping_threshold,
  }
}

function normalizeReturnInfo(returns: LegacyReturnInfo): ProductReturnInfo {
  const normalized: ProductReturnInfo = {
    ...DEFAULT_STORE_POLICY.returns,
    ...returns,
    eligible_cases: returns.eligible_cases?.trim() || DEFAULT_STORE_POLICY.returns.eligible_cases,
    ineligible_cases:
      returns.ineligible_cases?.trim() || DEFAULT_STORE_POLICY.returns.ineligible_cases,
    shipping_fee_notes:
      returns.shipping_fee_notes?.trim() || DEFAULT_STORE_POLICY.returns.shipping_fee_notes,
  }

  if (returns.notes?.trim() && !returns.eligible_cases?.trim()) {
    normalized.eligible_cases = returns.notes.trim()
  }

  return normalized
}

export function loadStorePolicy(): StorePolicy {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_STORE_POLICY
    }

    const parsed = JSON.parse(raw) as StorePolicy
    return {
      shipping: normalizeShippingInfo(parsed.shipping ?? {}),
      returns: normalizeReturnInfo(parsed.returns ?? {}),
    }
  } catch {
    return DEFAULT_STORE_POLICY
  }
}

export function saveStorePolicy(policy: StorePolicy): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(policy))
}
