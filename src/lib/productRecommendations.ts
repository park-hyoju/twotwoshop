import { isProductPurchasable } from './productStock'
import { productRepository } from '../services/productRepository'
import type { Product } from '../types/product'

export const MAX_PRODUCT_RECOMMENDATIONS = 4

/**
 * Returns only admin-curated related products from `product_related`.
 * Does not auto-fill by category, popularity, or random products.
 */
export async function loadProductRecommendations(product: Product): Promise<Product[]> {
  const curated = (await productRepository.findRelatedProducts(product.id)).filter(
    (item) =>
      item.id !== product.id && item.status === 'active' && isProductPurchasable(item),
  )

  return curated.slice(0, MAX_PRODUCT_RECOMMENDATIONS)
}
