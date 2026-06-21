import type {
  AdminProductDetailForm,
  AdminProductInfoFields,
  AdminReturnInfoFields,
  AdminShippingInfoFields,
  AdminSizeGuide,
  AdminSizeGuideRow,
} from '../types/adminProductDetail'

export const EMPTY_SIZE_GUIDE_ROW: AdminSizeGuideRow = {
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

export const EMPTY_SIZE_GUIDE: AdminSizeGuide = {
  rows: [],
  model_info: '',
}

export const EMPTY_PRODUCT_INFO: AdminProductInfoFields = {
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

export const EMPTY_SHIPPING_INFO: AdminShippingInfoFields = {
  shipping_fee: '',
  delivery_period: '',
  free_shipping_threshold: '',
}

export const EMPTY_RETURN_INFO: AdminReturnInfoFields = {
  exchange_period: '',
  return_address: '',
  notes: '',
}

export function createEmptyProductDetailForm(id: string): AdminProductDetailForm {
  return {
    id,
    name: '',
    slug: '',
    brand: '',
    sku: '',
    display_category: 'misc',
    detail_category: 'accessory',
    gender: 'common',
    status: 'active',
    price: 0,
    original_price: 0,
    discount_rate: 0,
    stock: 0,
    thumbnail: '',
    images: [],
    short_description: '',
    description: '',
    size_guide: { ...EMPTY_SIZE_GUIDE, rows: [] },
    product_info: { ...EMPTY_PRODUCT_INFO },
    shipping_info: { ...EMPTY_SHIPPING_INFO },
    return_info: { ...EMPTY_RETURN_INFO },
    meta_title: '',
    meta_description: '',
  }
}
