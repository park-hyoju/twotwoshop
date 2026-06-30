import {
  SHIPPING_POLICY_ADDITIONAL_NOTES,
  SHIPPING_POLICY_FREE_DETAIL,
  SHIPPING_POLICY_PAID_DETAIL,
} from '../lib/orderConstants'

export interface ProductSizeGuideRow {
  size: string
  total_length: string
  shoulder: string
  chest: string
  sleeve: string
  waist: string
  hip: string
  rise: string
  thigh: string
  hem: string
}

export interface ProductSizeGuide {
  rows: ProductSizeGuideRow[]
  model_info: string
}

export interface ProductInfoFields {
  material: string
  origin_country: string
  manufacturer: string
  care_instructions: string
  thickness: string
  stretch: string
  sheer: string
  lining: string
  fit: string
}

export interface ProductShippingInfo {
  shipping_fee: string
  delivery_period: string
  free_shipping_threshold: string
  additional_notes: string
}

export interface ProductReturnInfo {
  exchange_period: string
  return_address: string
  eligible_cases: string
  ineligible_cases: string
  shipping_fee_notes: string
}

export const EMPTY_PRODUCT_SIZE_GUIDE_ROW: ProductSizeGuideRow = {
  size: '',
  total_length: '',
  shoulder: '',
  chest: '',
  sleeve: '',
  waist: '',
  hip: '',
  rise: '',
  thigh: '',
  hem: '',
}

export const EMPTY_PRODUCT_SIZE_GUIDE: ProductSizeGuide = {
  rows: [],
  model_info: '',
}

export const EMPTY_PRODUCT_INFO: ProductInfoFields = {
  material: '',
  origin_country: '',
  manufacturer: '',
  care_instructions: '',
  thickness: '',
  stretch: '',
  sheer: '',
  lining: '',
  fit: '',
}

export const EMPTY_PRODUCT_SHIPPING_INFO: ProductShippingInfo = {
  shipping_fee: '',
  delivery_period: '',
  free_shipping_threshold: '',
  additional_notes: '',
}

export const EMPTY_PRODUCT_RETURN_INFO: ProductReturnInfo = {
  exchange_period: '',
  return_address: '',
  eligible_cases: '',
  ineligible_cases: '',
  shipping_fee_notes: '',
}


export const DEFAULT_PRODUCT_SHIPPING_INFO: ProductShippingInfo = {
  shipping_fee: SHIPPING_POLICY_PAID_DETAIL,
  delivery_period:
    '결제 완료 후 평균 3~5일 이내 발송됩니다.\n주말·공휴일은 배송 기간에서 제외됩니다.',
  free_shipping_threshold: SHIPPING_POLICY_FREE_DETAIL,
  additional_notes: SHIPPING_POLICY_ADDITIONAL_NOTES,
}

export const DEFAULT_PRODUCT_RETURN_INFO: ProductReturnInfo = {
  exchange_period: '상품 수령 후 3일 이내 교환 및 반품 신청이 가능합니다.',
  return_address:
    '반품 접수 후 고객센터 또는 1:1 문의를 통해 안내받은 주소로 발송해 주세요.',
  eligible_cases:
    '상품 수령 후 3일 이내 신청\n택, 라벨, 포장이 훼손되지 않은 경우\n착용 또는 사용하지 않은 상품',
  ineligible_cases:
    '착용 또는 사용한 상품\n택, 라벨, 포장이 훼손된 경우\n고객 부주의로 상품 가치가 훼손된 경우',
  shipping_fee_notes:
    '단순 변심 교환·반품 시 왕복 배송비는 고객 부담\n오배송 또는 불량 상품은 판매자 부담',
}
