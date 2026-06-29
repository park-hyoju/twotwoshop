export type { ProductCategoryGroup as StorefrontCategory } from '../constants/productCategories'
export { PRODUCT_CATEGORY_GROUP_LABELS as STOREFRONT_CATEGORY_LABELS } from '../constants/productCategories'

import type { ProductCategoryGroup } from '../constants/productCategories'

export function isStorefrontCategory(value: string): value is ProductCategoryGroup {
  return value === 'women' || value === 'men' || value === 'common'
}
