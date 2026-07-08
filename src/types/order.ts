export interface OrderItem {
  productId: string
  slug: string
  name: string
  price: number
  quantity: number
  thumbnail: string
  selectedColor?: string
  selectedSize?: string
  optionId?: string
}

export interface ShippingInfo {
  postalCode: string
  address: string
  addressDetail: string
  memo: string
}

export type PaymentMethod = 'bank_transfer'

export type PaymentStatus = 'waiting_deposit' | 'paid' | 'refunded'

export interface Order {
  id?: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  recipientName: string
  recipientPhone: string
  depositorName: string
  shipping: ShippingInfo
  items: OrderItem[]
  productTotal: number
  couponDiscount: number
  shippingFee: number
  totalAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  memberCouponId: string | null
  isMember: boolean
  createdAt: string
}

export interface CheckoutFormData {
  customerName: string
  customerPhone: string
  customerEmail: string
  recipientName: string
  recipientPhone: string
  postalCode: string
  address: string
  addressDetail: string
  memo: string
  depositorName: string
  sameAsOrdererForDepositor: boolean
  sameAsOrdererForRecipient: boolean
  selectedCouponId: string | null
  agreedOrder: boolean
  agreedPrivacy: boolean
}

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormData, string>>

export const INITIAL_CHECKOUT_FORM: CheckoutFormData = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  recipientName: '',
  recipientPhone: '',
  postalCode: '',
  address: '',
  addressDetail: '',
  memo: '',
  depositorName: '',
  sameAsOrdererForDepositor: true,
  sameAsOrdererForRecipient: true,
  selectedCouponId: null,
  agreedOrder: false,
  agreedPrivacy: false,
}
