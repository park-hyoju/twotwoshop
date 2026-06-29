import { ROUTES } from './routes'
import {
  buildSearchCorrectionMessage,
  filterProductsByKeyword,
  matchesProductKeyword,
  normalizeKeyword,
  searchProducts,
} from './search'

export {
  buildSearchCorrectionMessage,
  filterProductsByKeyword,
  matchesProductKeyword,
  normalizeKeyword,
  searchProducts,
}

/** @deprecated Use normalizeKeyword from lib/search instead. */
export const normalizeProductSearchQuery = normalizeKeyword

/** @deprecated Use matchesProductKeyword from lib/search instead. */
export const matchesProductSearch = matchesProductKeyword

/** @deprecated Use filterProductsByKeyword from lib/search instead. */
export const filterProductsBySearch = filterProductsByKeyword

export function buildProductSearchUrl(query: string): string {
  const normalized = normalizeKeyword(query)

  if (!normalized) {
    return ROUTES.products
  }

  const params = new URLSearchParams({ search: normalized })
  return `${ROUTES.products}?${params.toString()}`
}
