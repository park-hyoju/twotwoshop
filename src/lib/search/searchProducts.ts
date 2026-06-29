import { getProductCategoryDisplayLabel } from '../../constants/productCategories'
import type { Product } from '../../types/product'
import { convertEngToKor, isEngKeyboardInput } from './convertEngToKor'
import { keywordsMatch, normalizeKeyword } from './normalizeKeyword'

export interface ProductSearchResult {
  products: Product[]
  query: string
  originalQuery: string
  correctedQuery?: string
  wasCorrected: boolean
}

type SearchableProduct = Product & {
  brand?: string | null
}

function getSearchableValues(product: SearchableProduct): string[] {
  const values = [
    product.name,
    product.shortDescription,
    product.description,
    getProductCategoryDisplayLabel(product.productCategory),
    product.slug,
    ...product.tags,
  ]

  if (product.brand?.trim()) {
    values.push(product.brand.trim())
  }

  return values.filter((value) => value.length > 0)
}

export function matchesProductKeyword(product: Product, rawQuery: string): boolean {
  const query = normalizeKeyword(rawQuery)
  if (!query) {
    return true
  }

  return getSearchableValues(product).some((value) => keywordsMatch(query, value))
}

export function filterProductsByKeyword(products: Product[], rawQuery: string): Product[] {
  const query = normalizeKeyword(rawQuery)
  if (!query) {
    return products
  }

  return products.filter((product) => matchesProductKeyword(product, query))
}

export function searchProducts(products: Product[], rawQuery: string): ProductSearchResult {
  const originalQuery = rawQuery
  const query = normalizeKeyword(rawQuery)

  if (!query) {
    return {
      products,
      query: '',
      originalQuery,
      wasCorrected: false,
    }
  }

  const primaryResults = filterProductsByKeyword(products, query)
  if (primaryResults.length > 0) {
    return {
      products: primaryResults,
      query,
      originalQuery,
      wasCorrected: false,
    }
  }

  if (isEngKeyboardInput(query)) {
    const correctedQuery = convertEngToKor(query)
    if (correctedQuery && correctedQuery !== query) {
      const correctedResults = filterProductsByKeyword(products, correctedQuery)
      if (correctedResults.length > 0) {
        return {
          products: correctedResults,
          query: correctedQuery,
          originalQuery,
          correctedQuery,
          wasCorrected: true,
        }
      }
    }
  }

  return {
    products: [],
    query,
    originalQuery,
    wasCorrected: false,
  }
}

export function buildSearchCorrectionMessage(correctedQuery: string): string {
  return `${correctedQuery} 검색 결과를 보여드려요 😊`
}
