import { productRepository } from '../services/productRepository'
import type { Product } from '../types/product'
import type { CartItem, CartSyncNoticeType, CartSyncOutcome } from '../types/cart'
import { getCartLineId } from '../lib/cartLine'
import {
  findProductVariant,
  getProductOptionStock,
  hasProductOptions,
} from '../lib/productVariants'
import { createCartItemFromProduct, normalizeCartItems } from './cartStore'

export const CART_SYNC_MESSAGES: Record<CartSyncNoticeType, string> = {
  infoChanged: '일부 상품 정보가 변경되었습니다.',
  soldOutDetected: '일부 상품이 품절되었습니다.',
  quantityAdjusted: '재고 수량에 맞게 수량이 조정되었습니다.',
  unavailableRemoved: '판매 중이 아닌 상품이 장바구니에서 제외되었습니다.',
}

export type ResolveProductForCartSync = (slug: string) => Promise<Product | undefined>

export function getSyncNoticeMessages(notices: CartSyncNoticeType[]): string[] {
  return notices.map((notice) => CART_SYNC_MESSAGES[notice])
}

function resolveCartItemStock(product: Product, item: CartItem): number {
  if (hasProductOptions(product) && (item.selectedColor || item.selectedSize)) {
    return getProductOptionStock(product, item.selectedColor ?? '', item.selectedSize ?? '')
  }

  return product.stock
}

function syncSingleCartItem(
  item: CartItem,
  product: Product,
  notices: Set<CartSyncNoticeType>,
): CartItem {
  const stock = resolveCartItemStock(product, item)
  const isSoldOut = stock === 0 || product.status === 'soldout'
  const priceChanged = item.price !== product.price
  const productIdChanged = item.productId !== product.id
  const infoChanged =
    priceChanged ||
    productIdChanged ||
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

    return {
      ...item,
      cartLineId: getCartLineId(item),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      thumbnail: product.thumbnail,
      stock: 0,
      quantity: item.quantity,
      optionId:
        item.optionId ??
        findProductVariant(
          product.variants,
          item.selectedColor ?? '',
          item.selectedSize ?? '',
        )?.id,
    }
  }

  let quantity = item.quantity
  if (quantity > stock) {
    quantity = stock
    notices.add('quantityAdjusted')
  }

  return createCartItemFromProduct(product, quantity, {
    color: item.selectedColor,
    size: item.selectedSize,
  })
}

export async function syncCartItemsWithResolver(
  items: CartItem[],
  resolveProduct: ResolveProductForCartSync,
): Promise<CartSyncOutcome> {
  const normalized = normalizeCartItems(items)
  const notices = new Set<CartSyncNoticeType>()
  const syncedItems: CartItem[] = []

  for (const item of normalized) {
    const slug = item.slug?.trim()
    if (!slug) {
      notices.add('unavailableRemoved')
      continue
    }

    const product = await resolveProduct(slug)

    if (!product || product.status === 'hidden') {
      notices.add('unavailableRemoved')
      continue
    }

    syncedItems.push(syncSingleCartItem(item, product, notices))
  }

  return {
    items: syncedItems,
    notices: [...notices],
  }
}

export async function syncCartItems(items: CartItem[]): Promise<CartSyncOutcome> {
  return syncCartItemsWithResolver(items, (slug) =>
    productRepository.findProductBySlugForCartSync(slug),
  )
}
