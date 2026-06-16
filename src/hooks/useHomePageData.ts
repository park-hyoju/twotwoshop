import { benefits, categoryShortcuts, heroBanner, liveBanner } from '../data'
import {
  getBestProducts,
  getNewProducts,
  getSaleProducts,
} from '../services/products'

export function useHomePageData() {
  return {
    heroBanner,
    categoryShortcuts,
    bestProducts: getBestProducts(),
    newProducts: getNewProducts(),
    saleProducts: getSaleProducts(),
    liveBanner,
    benefits,
  }
}
