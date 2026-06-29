/**
 * Static product data layer (sync).
 *
 * - Reads from `src/data/products.ts` only.
 * - Used as fallback when Supabase is unavailable (`productRepository`).
 * - Cart sync (`cartSync`) still resolves products by id here — not migrated in v0.8 Step 4.
 *
 * For storefront UI, prefer `productRepository` (async, Supabase + fallback to this module).
 */
import {
  getCategoryIdsForGroup,
  type ProductCategoryGroup,
  type ProductCategoryId,
} from '../constants/productCategories'
import { PRODUCTS } from '../data/products'
import type { Product } from '../types/product'
import { enrichProduct } from './productMapper'

function isVisibleOnStorefront(product: Product): boolean {
  return product.status !== 'hidden'
}

function sortByCreatedAtDesc(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function filterStorefront(products: Product[]): Product[] {
  return sortByCreatedAtDesc(products.filter(isVisibleOnStorefront).map(enrichProduct))
}

function matchesCategoryGroup(product: Product, group: ProductCategoryGroup): boolean {
  const ids = getCategoryIdsForGroup(group)
  return ids.includes(product.productCategory)
}

export function getAllProducts(): Product[] {
  return filterStorefront(PRODUCTS)
}

export function getNewProducts(): Product[] {
  return filterStorefront(PRODUCTS.filter((product) => product.isNew))
}

export function getBestProducts(): Product[] {
  return filterStorefront(PRODUCTS.filter((product) => product.isBest))
}

export function getSaleProducts(): Product[] {
  return filterStorefront(PRODUCTS.filter((product) => product.isSale))
}

export function getProductBySlug(slug: string): Product | undefined {
  const product = PRODUCTS.find(
    (item) => item.slug === slug && isVisibleOnStorefront(item),
  )

  return product ? enrichProduct(product) : undefined
}

export function getProductById(id: string): Product | undefined {
  const product = PRODUCTS.find((item) => item.id === id)
  return product ? enrichProduct(product) : undefined
}

export function getProductsByCategoryGroup(group: ProductCategoryGroup): Product[] {
  return filterStorefront(PRODUCTS.filter((product) => matchesCategoryGroup(enrichProduct(product), group)))
}

export function getProductsByProductCategory(categoryId: ProductCategoryId): Product[] {
  return filterStorefront(
    PRODUCTS.filter((product) => enrichProduct(product).productCategory === categoryId),
  )
}

export function getPerfumeProducts(): Product[] {
  return getProductsByProductCategory('perfume')
}

/** @deprecated 레거시 호환 */
export function getProductsByGender(gender: 'women' | 'men' | 'common' | 'perfume') {
  if (gender === 'perfume') {
    return getPerfumeProducts()
  }

  if (gender === 'women' || gender === 'men') {
    return getProductsByCategoryGroup(gender)
  }

  return filterStorefront(PRODUCTS.filter((product) => enrichProduct(product).gender === 'common'))
}

/** @deprecated 레거시 호환 */
export function getProductsByDisplayCategory() {
  return getAllProducts()
}

/** @deprecated 레거시 호환 */
export function getProductsByDetailCategory() {
  return getAllProducts()
}
