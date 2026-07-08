import { isProductPurchasable } from './productStock'
import { productRepository } from '../services/productRepository'
import type { Product } from '../types/product'

export const MAX_PRODUCT_RECOMMENDATIONS = 4

export async function loadProductRecommendations(product: Product): Promise<Product[]> {
  const curated = (await productRepository.findRelatedProducts(product.id)).filter(
    (item) =>
      item.id !== product.id && item.status === 'active' && isProductPurchasable(item),
  )

  if (curated.length >= MAX_PRODUCT_RECOMMENDATIONS) {
    return curated.slice(0, MAX_PRODUCT_RECOMMENDATIONS)
  }

  const categoryProducts = await productRepository.findProductsByProductCategory(
    product.productCategory,
  )
  const usedIds = new Set([product.id, ...curated.map((item) => item.id)])

  const autoFill = categoryProducts.filter(
    (item) => !usedIds.has(item.id) && item.status === 'active' && isProductPurchasable(item),
  )

  return [...curated, ...autoFill].slice(0, MAX_PRODUCT_RECOMMENDATIONS)
}
