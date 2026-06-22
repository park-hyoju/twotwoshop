import { ROUTES } from './routes'
import type { Product } from '../types/product'

export function normalizeProductSearchQuery(query: string): string {
  return query.trim()
}

export function matchesProductSearch(product: Product, rawQuery: string): boolean {
  const query = normalizeProductSearchQuery(rawQuery).toLowerCase()

  if (!query) {
    return true
  }

  const searchableValues = [
    product.name,
    product.slug,
    product.shortDescription,
    product.description,
    ...product.tags,
  ]

  return searchableValues.some((value) => value.toLowerCase().includes(query))
}

export function filterProductsBySearch(products: Product[], rawQuery: string): Product[] {
  const query = normalizeProductSearchQuery(rawQuery)

  if (!query) {
    return products
  }

  return products.filter((product) => matchesProductSearch(product, query))
}

export function buildProductSearchUrl(query: string): string {
  const normalized = normalizeProductSearchQuery(query)

  if (!normalized) {
    return ROUTES.products
  }

  const params = new URLSearchParams({ search: normalized })
  return `${ROUTES.products}?${params.toString()}`
}
