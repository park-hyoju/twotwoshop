import {
  getAllProducts,
  getBestProducts,
  getNewProducts,
  getSaleProducts,
} from '../../services/productService'
import { ProductListPage } from '../../components/product/ProductListPage'

export function ProductsAllPage() {
  return (
    <ProductListPage
      title="전체 상품"
      description="투투샵의 모든 상품을 한곳에서 확인하세요."
      products={getAllProducts()}
    />
  )
}

export function ProductsNewPage() {
  return (
    <ProductListPage
      title="신상품"
      description="최근 등록된 상품을 모아보세요."
      products={getNewProducts()}
    />
  )
}

export function ProductsBestPage() {
  return (
    <ProductListPage
      title="인기상품"
      description="많은 고객이 선택한 인기 상품입니다."
      products={getBestProducts()}
    />
  )
}

export function ProductsSalePage() {
  return (
    <ProductListPage
      title="특가상품"
      description="할인 중인 특가 상품을 확인하세요."
      products={getSaleProducts()}
    />
  )
}
