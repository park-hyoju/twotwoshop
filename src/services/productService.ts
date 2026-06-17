/**
 * Static product data layer (sync).
 *
 * - Reads from `src/data/products.ts` only.
 * - Used as fallback when Supabase is unavailable (`productRepository`).
 * - Cart sync (`cartSync`) still resolves products by id here — not migrated in v0.8 Step 4.
 *
 * For storefront UI, prefer `productRepository` (async, Supabase + fallback to this module).
 */
import { PRODUCTS } from '../data/products'
import type { DetailCategory } from '../types/detailCategory'
import type { DisplayCategory } from '../types/displayCategory'
import type { Gender } from '../types/gender'
import type { Product } from '../types/product'

function isVisibleOnStorefront(product: Product): boolean {
  return product.status !== 'hidden'
}

function sortByCreatedAtDesc(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function filterStorefront(products: Product[]): Product[] {
  return sortByCreatedAtDesc(products.filter(isVisibleOnStorefront))
}

function matchesGender(product: Product, gender: Gender): boolean {
  return product.gender === gender || product.gender === 'common'
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
  return PRODUCTS.find(
    (product) => product.slug === slug && isVisibleOnStorefront(product),
  )
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id)
}

export function getProductsByGender(gender: Gender): Product[] {
  return filterStorefront(PRODUCTS.filter((product) => matchesGender(product, gender)))
}

export function getProductsByDisplayCategory(
  gender: Gender,
  displayCategory: DisplayCategory,
): Product[] {
  return filterStorefront(
    PRODUCTS.filter(
      (product) =>
        matchesGender(product, gender) && product.displayCategory === displayCategory,
    ),
  )
}

export function getProductsByDetailCategory(
  detailCategory: DetailCategory,
): Product[] {
  return filterStorefront(
    PRODUCTS.filter((product) => product.detailCategory === detailCategory),
  )
}
