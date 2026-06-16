import type { AddToCartResult } from '../types/cart'

export const ADD_TO_CART_MESSAGES: Record<AddToCartResult, string> = {
  success: '장바구니에 담았습니다.',
  alreadyMaxQuantity: '이미 담을 수 있는 최대 수량입니다.',
  soldOut: '품절 상품은 담을 수 없습니다.',
  notAvailable: '판매 중인 상품이 아닙니다.',
}
