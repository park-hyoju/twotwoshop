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
}

export interface ProductReturnInfo {
  exchange_period: string
  return_address: string
  notes: string
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
}

export const EMPTY_PRODUCT_RETURN_INFO: ProductReturnInfo = {
  exchange_period: '',
  return_address: '',
  notes: '',
}

export const DEFAULT_PRODUCT_SHIPPING_INFO: ProductShippingInfo = {
  shipping_fee: '3,000원 (5만원 이상 구매 시 무료배송)',
  delivery_period: '결제 완료 후 2~5일 이내 출고됩니다.',
  free_shipping_threshold: '50,000원 이상 구매 시 무료배송',
}

export const DEFAULT_PRODUCT_SHIPPING_NOTES =
  '주말 및 공휴일에는 출고가 지연될 수 있습니다. 도서산간·제주 지역은 추가 배송비가 발생할 수 있으며, 배송 상황에 따라 도착일이 달라질 수 있습니다.'

export const DEFAULT_PRODUCT_RETURN_INFO: ProductReturnInfo = {
  exchange_period: '상품 수령 후 7일 이내 신청 가능',
  return_address: '고객센터(1:1 문의) 안내에 따라 반송해주세요.',
  notes:
    '상품 택·라벨이 제거되지 않은 미착용 상품에 한해 교환 및 환불이 가능합니다. 단순 변심에 의한 반품 시 왕복 배송비가 발생할 수 있습니다.',
}
