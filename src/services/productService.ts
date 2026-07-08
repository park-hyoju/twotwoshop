/**
 * Static product data layer (sync).
 *
 * Development seed catalog removed. Returns empty arrays — use productRepository (Supabase).
 */
import {
  type ProductCategoryGroup,
  type ProductCategoryId,
} from '../constants/productCategories'
import type { Product } from '../types/product'

export function getAllProducts(): Product[] {
  return []
}

export function getNewProducts(): Product[] {
  return []
}

export function getBestProducts(): Product[] {
  return []
}

export function getSaleProducts(): Product[] {
  return []
}

export function getProductBySlug(_slug: string): Product | undefined {
  return undefined
}

export function getProductById(_id: string): Product | undefined {
  return undefined
}

export function getProductsByCategoryGroup(_group: ProductCategoryGroup): Product[] {
  return []
}

export function getProductsByProductCategory(_categoryId: ProductCategoryId): Product[] {
  return []
}

export function getPerfumeProducts(): Product[] {
  return []
}

/** @deprecated 레거시 호환 */
export function getProductsByGender(_gender: 'women' | 'men' | 'common' | 'perfume') {
  return []
}

/** @deprecated 레거시 호환 */
export function getProductsByDisplayCategory() {
  return []
}

/** @deprecated 레거시 호환 */
export function getProductsByDetailCategory() {
  return []
}
