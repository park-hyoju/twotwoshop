export interface CartItem {
  cartLineId?: string
  productId: string
  slug: string
  name: string
  price: number
  thumbnail: string
  quantity: number
  stock: number
  selectedColor?: string
  selectedSize?: string
  optionId?: string
}

export type AddToCartResult =
  | 'success'
  | 'alreadyMaxQuantity'
  | 'soldOut'
  | 'notAvailable'
  | 'optionRequired'

export type CartSyncNoticeType =
  | 'infoChanged'
  | 'soldOutDetected'
  | 'quantityAdjusted'
  | 'unavailableRemoved'

export interface AddToCartInput {
  color?: string
  size?: string
  quantity?: number
}

export interface AddToCartOutcome {
  items: CartItem[]
  result: AddToCartResult
}

export interface CartSyncOutcome {
  items: CartItem[]
  notices: CartSyncNoticeType[]
}
