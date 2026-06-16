export interface OrderItem {
  productId: string
  slug: string
  name: string
  price: number
  quantity: number
  thumbnail: string
}

export interface ShippingInfo {
  postalCode: string
  address: string
  addressDetail: string
  memo: string
}

export interface Order {
  orderNumber: string
  customerName: string
  phone: string
  shipping: ShippingInfo
  items: OrderItem[]
  productTotal: number
  shippingFee: number
  totalAmount: number
  createdAt: string
}

export interface CheckoutFormData {
  customerName: string
  phone: string
  postalCode: string
  address: string
  addressDetail: string
  memo: string
}

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormData, string>>
