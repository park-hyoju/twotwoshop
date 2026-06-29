export {
  getAllProducts,
  getBestProducts,
  getNewProducts,
  getProductById,
  getProductBySlug,
  getProductsByCategoryGroup,
  getProductsByProductCategory,
  getProductsByGender,
  getPerfumeProducts,
  getSaleProducts,
} from './productService'

export {
  productRepository,
  type ProductRepository,
} from './productRepository'

export { orderRepository, type OrderRepository } from './orderRepository'
