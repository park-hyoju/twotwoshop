import { PRODUCTS } from '../data/products'
import type {
  Product,
  ProductCategory,
  ProductGender,
} from '../types/product'

function isVisibleOnStorefront(product: Product): boolean {
  return product.status !== 'hidden'
}

function sortByCreatedAtDesc(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function getAllProducts(): Product[] {
  return sortByCreatedAtDesc(PRODUCTS.filter(isVisibleOnStorefront))
}

export function getNewProducts(): Product[] {
  return sortByCreatedAtDesc(
    PRODUCTS.filter((product) => isVisibleOnStorefront(product) && product.isNew),
  )
}

export function getBestProducts(): Product[] {
  return sortByCreatedAtDesc(
    PRODUCTS.filter((product) => isVisibleOnStorefront(product) && product.isBest),
  )
}

export function getSaleProducts(): Product[] {
  return sortByCreatedAtDesc(
    PRODUCTS.filter((product) => isVisibleOnStorefront(product) && product.isSale),
  )
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find(
    (product) => product.slug === slug && isVisibleOnStorefront(product),
  )
}

export function getProductsByGender(gender: ProductGender): Product[] {
  return sortByCreatedAtDesc(
    PRODUCTS.filter(
      (product) =>
        isVisibleOnStorefront(product) &&
        (product.gender === gender || product.gender === 'common'),
    ),
  )
}

export function getProductsByCategory(
  gender: ProductGender,
  category: ProductCategory,
): Product[] {
  return sortByCreatedAtDesc(
    PRODUCTS.filter(
      (product) =>
        isVisibleOnStorefront(product) &&
        product.category === category &&
        (product.gender === gender || product.gender === 'common'),
    ),
  )
}
