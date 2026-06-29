import {
  PRODUCT_CATEGORIES,
  type ProductCategoryId,
} from '../../constants/productCategories'
import { createCategoryProductPage } from './CategoryProductPages'

export const categoryPageById = Object.fromEntries(
  PRODUCT_CATEGORIES.map((category) => [category.id, createCategoryProductPage(category.id)]),
) as Record<ProductCategoryId, ReturnType<typeof createCategoryProductPage>>

export function getCategoryPage(categoryId: ProductCategoryId) {
  return categoryPageById[categoryId]
}
