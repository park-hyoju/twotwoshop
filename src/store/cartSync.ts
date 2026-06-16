import { getProductById } from '../services/productService'
import type { CartItem, CartSyncNoticeType, CartSyncOutcome } from '../types/cart'
import { createCartItemFromProduct, normalizeCartItems } from './cartStore'

export const CART_SYNC_MESSAGES: Record<CartSyncNoticeType, string> = {
  infoChanged: '일부 상품 정보가 변경되었습니다.',
  soldOutDetected: '일부 상품이 품절되었습니다.',
  quantityAdjusted: '재고 수량에 맞게 수량이 조정되었습니다.',
  unavailableRemoved: '판매 중이 아닌 상품이 장바구니에서 제외되었습니다.',
}

export function getSyncNoticeMessages(notices: CartSyncNoticeType[]): string[] {
  return notices.map((notice) => CART_SYNC_MESSAGES[notice])
}

export function syncCartItems(items: CartItem[]): CartSyncOutcome {
  const normalized = normalizeCartItems(items)
  const notices = new Set<CartSyncNoticeType>()
  const syncedItems: CartItem[] = []

  for (const item of normalized) {
    const product = getProductById(item.productId)

    if (!product || product.status === 'hidden') {
      notices.add('unavailableRemoved')
      continue
    }

    const isSoldOut = product.stock === 0
    const priceChanged = item.price !== product.price
    const infoChanged =
      priceChanged ||
      item.name !== product.name ||
      item.slug !== product.slug ||
      item.thumbnail !== product.thumbnail

    if (infoChanged) {
      notices.add('infoChanged')
    }

    if (isSoldOut) {
      if (item.stock > 0) {
        notices.add('soldOutDetected')
      }

      syncedItems.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        thumbnail: product.thumbnail,
        stock: 0,
        quantity: item.quantity,
      })
      continue
    }

    let quantity = item.quantity
    if (quantity > product.stock) {
      quantity = product.stock
      notices.add('quantityAdjusted')
    }

    syncedItems.push(
      createCartItemFromProduct(product, quantity),
    )
  }

  return {
    items: syncedItems,
    notices: [...notices],
  }
}
