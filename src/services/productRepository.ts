import type { DetailCategory } from '../types/detailCategory'
import type { DisplayCategory } from '../types/displayCategory'
import type { Gender } from '../types/gender'
import type { Product } from '../types/product'
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
  findAllProducts(): Product[]
  findProductBySlug(slug: string): Product | undefined
  findProductsByCategory(filter?: ProductCategoryFilter): Product[]
  findBestProducts(): Product[]
  findNewProducts(): Product[]
  findSaleProducts(): Product[]
}

const staticProductRepository: ProductRepository = {
  findAllProducts: () => getAllProducts(),

  findProductBySlug: (slug) => getProductBySlug(slug),

  findProductsByCategory: (filter = {}) => {
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
  },

  findBestProducts: () => getBestProducts(),

  findNewProducts: () => getNewProducts(),

  findSaleProducts: () => getSaleProducts(),
}

export const productRepository: ProductRepository = staticProductRepository
