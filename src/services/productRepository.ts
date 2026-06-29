/**
 * Storefront product data entry point (async).
 *
 * - When `VITE_SUPABASE_*` env vars are set: fetches `active` products from Supabase.
 * - On missing env, query error, or empty result: falls back to `productService` (static).
 * - UI pages should use this repository; do not call Supabase directly from components.
 */
import {
  getCategoryIdsForGroup,
  type ProductCategoryGroup,
  type ProductCategoryId,
} from '../constants/productCategories'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Product } from '../types/product'
import {
  mapProductRowToProduct,
  type ProductRow,
} from './productMapper'
import {
  getAllProducts,
  getBestProducts,
  getNewProducts,
  getPerfumeProducts,
  getProductsByCategoryGroup,
  getProductsByProductCategory,
  getSaleProducts,
} from './productService'

export interface ProductRepository {
  findAllProducts(): Promise<Product[]>
  findProductBySlug(slug: string): Promise<Product | undefined>
  findProductsByProductCategory(categoryId: ProductCategoryId): Promise<Product[]>
  findProductsByCategoryGroup(group: ProductCategoryGroup): Promise<Product[]>
  findBestProducts(): Promise<Product[]>
  findNewProducts(): Promise<Product[]>
  findSaleProducts(): Promise<Product[]>
  findPerfumeProducts(): Promise<Product[]>
  findRelatedProducts(productId: string): Promise<Product[]>
}

const PRODUCT_COLUMNS = '*'

interface ProductRowFilter {
  productCategory?: ProductCategoryId
  productCategories?: ProductCategoryId[]
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

  if (filter.productCategory) {
    query = query.eq('product_category', filter.productCategory)
  } else if (filter.productCategories && filter.productCategories.length > 0) {
    query = query.in('product_category', filter.productCategories)
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

  let rows = (data ?? []) as ProductRow[]

  if (!filter.productCategory && !filter.productCategories) {
    return rows
  }

  if (!filter.productCategory && filter.productCategories) {
    return rows
  }

  if (filter.productCategory && rows.length === 0) {
    const legacyRows = await fetchLegacyCategoryRows(filter.productCategory)
    return legacyRows
  }

  return rows
}

async function fetchLegacyCategoryRows(
  categoryId: ProductCategoryId,
): Promise<ProductRow[] | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('status', 'active')

  if (error) {
    return null
  }

  const rows = (data ?? []) as ProductRow[]
  return rows.filter((row) => {
    const mapped = mapProductRowToProduct(row)
    return mapped.productCategory === categoryId
  })
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

async function fetchRelatedProductRows(productId: string): Promise<ProductRow[] | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data: links, error: linksError } = await supabase
    .from('product_related')
    .select('related_product_id, sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (linksError) {
    console.warn('[productRepository] Related products fetch failed:', linksError.message)
    return null
  }

  if (!links || links.length === 0) {
    return []
  }

  const relatedIds = links.map((link) => link.related_product_id)

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .in('id', relatedIds)
    .eq('status', 'active')

  if (productsError) {
    console.warn('[productRepository] Related product rows fetch failed:', productsError.message)
    return null
  }

  const productById = new Map(
    ((products ?? []) as ProductRow[]).map((row) => [row.id, row]),
  )

  return links
    .map((link) => productById.get(link.related_product_id))
    .filter((row): row is ProductRow => row !== undefined)
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
    }, () => getAllProducts().find((product) => product.slug === slug)),

  findProductsByProductCategory: (categoryId) =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows({ productCategory: categoryId })
      if (!rows) return null
      if (rows.length === 0) return null
      return mapRows(rows)
    }, () => getProductsByProductCategory(categoryId)),

  findProductsByCategoryGroup: (group) =>
    withSupabaseFallback(async () => {
      const categoryIds = getCategoryIdsForGroup(group)
      const rows = await fetchActiveProductRows({ productCategories: categoryIds })
      if (!rows) return null
      if (rows.length === 0) return null
      return mapRows(rows)
    }, () => getProductsByCategoryGroup(group)),

  findBestProducts: () =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows({ isBest: true })
      if (!rows) return null
      return mapRows(rows)
    }, getBestProducts),

  findNewProducts: () =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows({ isNew: true })
      if (!rows) return null
      return mapRows(rows)
    }, getNewProducts),

  findSaleProducts: () =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows({ isSale: true })
      if (!rows) return null
      return mapRows(rows)
    }, getSaleProducts),

  findPerfumeProducts: () =>
    withSupabaseFallback(async () => {
      const rows = await fetchActiveProductRows({ productCategory: 'perfume' })
      if (!rows) return null
      return mapRows(rows)
    }, getPerfumeProducts),

  findRelatedProducts: (productId) =>
    withSupabaseFallback(async () => {
      const rows = await fetchRelatedProductRows(productId)
      if (rows === null) return null
      if (rows.length === 0) return []
      return mapRows(rows)
    }, () => []),
}
