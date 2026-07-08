import {
  hasReturnInfoContent,
  hasShippingInfoContent,
} from './productDetailContent'
import {
  DEFAULT_PRODUCT_RETURN_INFO,
  DEFAULT_PRODUCT_SHIPPING_INFO,
} from '../types/productDetail'
import type { ProductReturnInfo, ProductShippingInfo } from '../types/productDetail'
import type { Product } from '../types/product'
import { loadStorePolicy } from './storePolicy'

const DEFAULT_COURIER = 'CJ대한통운'
const DEFAULT_DELIVERY_DURATION = '택배 수령까지 평균 2~3일 소요'

export interface ProductDetailShippingDisplay {
  shippingFee: string
  freeShippingCondition: string
  dispatchPeriod: string
  deliveryDuration: string
  courier: string
}

export interface ProductDetailReturnDisplay {
  exchangePeriod: string
  exchangeShippingFee: string
  returnShippingFee: string
  returnAddress: string
  ineligibleReasons: string
}

function resolveShippingInfo(product: Product): ProductShippingInfo {
  const policy = loadStorePolicy()

  if (hasShippingInfoContent(product.shippingInfo)) {
    return {
      ...DEFAULT_PRODUCT_SHIPPING_INFO,
      ...product.shippingInfo,
    }
  }

  return policy.shipping
}

function resolveReturnInfo(product: Product): ProductReturnInfo {
  const policy = loadStorePolicy()

  if (hasReturnInfoContent(product.returnInfo)) {
    return {
      ...DEFAULT_PRODUCT_RETURN_INFO,
      ...product.returnInfo,
    }
  }

  return policy.returns
}

function splitPolicyLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function getProductDetailShippingDisplay(product: Product): ProductDetailShippingDisplay {
  const shipping = resolveShippingInfo(product)
  const deliveryLines = splitPolicyLines(
    shipping.delivery_period.trim() || DEFAULT_PRODUCT_SHIPPING_INFO.delivery_period,
  )
  const noteLines = splitPolicyLines(shipping.additional_notes)

  return {
    shippingFee: shipping.shipping_fee.trim() || DEFAULT_PRODUCT_SHIPPING_INFO.shipping_fee,
    freeShippingCondition:
      shipping.free_shipping_threshold.trim() ||
      DEFAULT_PRODUCT_SHIPPING_INFO.free_shipping_threshold,
    dispatchPeriod: deliveryLines[0] ?? DEFAULT_PRODUCT_SHIPPING_INFO.delivery_period,
    deliveryDuration: deliveryLines[1] ?? DEFAULT_DELIVERY_DURATION,
    courier: noteLines.find((line) => line.includes('택배') || line.includes('통운')) ?? DEFAULT_COURIER,
  }
}

export function getProductDetailReturnDisplay(product: Product): ProductDetailReturnDisplay {
  const returns = resolveReturnInfo(product)
  const feeLines = splitPolicyLines(
    returns.shipping_fee_notes.trim() || DEFAULT_PRODUCT_RETURN_INFO.shipping_fee_notes,
  )

  return {
    exchangePeriod:
      returns.exchange_period.trim() || DEFAULT_PRODUCT_RETURN_INFO.exchange_period,
    exchangeShippingFee: feeLines[0] ?? DEFAULT_PRODUCT_RETURN_INFO.shipping_fee_notes,
    returnShippingFee: feeLines[0] ?? DEFAULT_PRODUCT_RETURN_INFO.shipping_fee_notes,
    returnAddress: returns.return_address.trim() || DEFAULT_PRODUCT_RETURN_INFO.return_address,
    ineligibleReasons:
      returns.ineligible_cases.trim() || DEFAULT_PRODUCT_RETURN_INFO.ineligible_cases,
  }
}
