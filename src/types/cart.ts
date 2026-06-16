export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number
  thumbnail: string
  quantity: number
  stock: number
}

export type AddToCartResult = 'success' | 'alreadyMaxQuantity' | 'soldOut' | 'notAvailable'

export type CartSyncNoticeType =
  | 'infoChanged'
  | 'soldOutDetected'
  | 'quantityAdjusted'
  | 'unavailableRemoved'

export interface AddToCartOutcome {
  items: CartItem[]
  result: AddToCartResult
}

export interface CartSyncOutcome {
  items: CartItem[]
  notices: CartSyncNoticeType[]
}
