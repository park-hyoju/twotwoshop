/**
 * Storefront product data entry point (async).
 *
 * - When `VITE_SUPABASE_*` env vars are set: fetches `active` products from Supabase.
 * - On missing env, query error, or empty result: falls back to `productService` (static).
 * - UI pages should use this repository; do not call Supabase directly from components.
 */
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { DetailCategory } from '../types/detailCategory'
import type { DisplayCategory } from '../types/displayCategory'
import type { Gender } from '../types/gender'
import type { Product } from '../types/product'
import {
  mapProductRowToProduct,
  type ProductRow,
} from './productMapper'
import {
  getAllProducts,
  getBestProducts,
  getNewProducts,
  getProductBySlug,
  getProductsByDetailCategory,
  getProductsByDisplayCategory,
  getProductsByGender,
  getSaleProducts,
} from './productService'

export interface ProductCategoryFilter {
  gender?: Gender
  displayCategory?: DisplayCategory
  detailCategory?: DetailCategory
}

export interface ProductRepository {
  findAllProducts(): Promise<Product[]>
  findProductBySlug(slug: string): Promise<Product | undefined>
  findProductsByCategory(filter?: ProductCategoryFilter): Promise<Product[]>
  findBestProducts(): Promise<Product[]>
  findNewProducts(): Promise<Product[]>
  findSaleProducts(): Promise<Product[]>
  findProductsByDisplayCategory(category: DisplayCategory): Promise<Product[]>
  findProductsByDetailCategory(category: DetailCategory): Promise<Product[]>
}

const PRODUCT_COLUMNS = '*'

interface ProductRowFilter {
  gender?: Gender
  displayCategory?: DisplayCategory
  detailCategory?: DetailCategory
  isBest?: boolean
  isNew?: boolean
  isSale?: boolean
}

function sortStorefrontProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const createdDiff =
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return createdDiff
  })
}

function mapRows(rows: ProductRow[]): Product[] {
  return sortStorefrontProducts(rows.map(mapProductRowToProduct))
}

async function fetchActiveProductRows(
  filter: ProductRowFilter = {},
): Promise<ProductRow[] | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  let query = supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('status', 'active')

  if (filter.gender) {
    query = query.eq('gender', filter.gender)
  }
  if (filter.displayCategory) {
    query = query.eq('display_category', filter.displayCategory)
  }
  if (filter.detailCategory) {
    query = query.eq('detail_category', filter.detailCategory)
  }
  if (filter.isBest !== undefined) {
    query = query.eq('is_best', filter.isBest)
  }
  if (filter.isNew !== undefined) {
    query = query.eq('is_new', filter.isNew)
  }
  if (filter.isSale !== undefined) {
    query = query.eq('is_sale', filter.isSale)
  }

  const { data, error } = await query
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[productRepository] Supabase fetch failed:', error.message)
    return null
  }

  return (data ?? []) as ProductRow[]
}

async function fetchActiveProductRowBySlug(
  slug: string,
): Promise<ProductRow | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    console.warn('[productRepository] Supabase slug fetch failed:', error.message)
    return null
  }

  return (data as ProductRow | null) ?? null
}

async function withSupabaseFallback<T>(
  fetcher: () => Promise<T | null>,
  fallback: () => T,
): Promise<T> {
  try {
    const result = await fetcher()
    if (result === null) {
      return fallback()
    }
    return result
  } catch (error) {
    console.warn('[productRepository] Unexpected error, using static fallback:', error)
    return fallback()
  }
}

export const productRepository: ProductRepository = {
  findAllProducts: () =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows()
      if (!rows) return null
      if (rows.length === 0) return null
      return mapRows(rows)
    }, getAllProducts),

  findProductBySlug: (slug) =>
    withSupabaseFallback(async () => {
      const row = await fetchActiveProductRowBySlug(slug)
      if (!row) return null
      return mapProductRowToProduct(row)
    }, () => getProductBySlug(slug)),

  findProductsByCategory: (filter = {}) =>
    withSupabaseFallback(async () => {
      const { gender, displayCategory, detailCategory } = filter

      if (detailCategory) {
        const rows = await fetchActiveProductRows({ detailCategory })
        if (!rows) return null
        if (rows.length === 0) return null
        return mapRows(rows)
      }

      if (gender && displayCategory) {
        const rows = await fetchActiveProductRows({ gender, displayCategory })
        if (!rows) return null
        if (rows.length === 0) return null
        return mapRows(rows)
      }

      if (gender) {
        const rows = await fetchActiveProductRows({ gender })
        if (!rows) return null
        if (rows.length === 0) return null
        return mapRows(rows)
      }

      const rows = await fetchActiveProductRows()
      if (!rows) return null
      if (rows.length === 0) return null
      return mapRows(rows)
    }, () => {
      const { gender, displayCategory, detailCategory } = filter

      if (detailCategory) {
        return getProductsByDetailCategory(detailCategory)
      }

      if (gender && displayCategory) {
        return getProductsByDisplayCategory(gender, displayCategory)
      }

      if (gender) {
        return getProductsByGender(gender)
      }

      return getAllProducts()
    }),

  findBestProducts: () =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows({ isBest: true })
      if (!rows) return null
      if (rows.length === 0) return null
      return mapRows(rows)
    }, getBestProducts),

  findNewProducts: () =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows({ isNew: true })
      if (!rows) return null
      if (rows.length === 0) return null
      return mapRows(rows)
    }, getNewProducts),

  findSaleProducts: () =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows({ isSale: true })
      if (!rows) return null
      if (rows.length === 0) return null
      return mapRows(rows)
    }, getSaleProducts),

  findProductsByDisplayCategory: (category) =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows({ displayCategory: category })
      if (!rows) return null
      if (rows.length === 0) return null
      return mapRows(rows)
    }, () =>
      getAllProducts().filter(
        (product) => product.displayCategory === category,
      ),
    ),

  findProductsByDetailCategory: (category) =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows({ detailCategory: category })
      if (!rows) return null
      if (rows.length === 0) return null
      return mapRows(rows)
    }, () => getProductsByDetailCategory(category)),
}
