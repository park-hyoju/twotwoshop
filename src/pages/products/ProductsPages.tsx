import { ProductListPage } from '../../components/product/ProductListPage'
import { useAsyncProducts } from '../../hooks/useAsyncProducts'
import { productRepository } from '../../services/productRepository'

export function ProductsAllPage() {
  const { products, isLoading } = useAsyncProducts(
    () => productRepository.findAllProducts(),
    'products-all',
  )

  return (
    <ProductListPage
      title="전체 상품"
      description="투투샵의 모든 상품을 한곳에서 확인하세요."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function ProductsNewPage() {
  const { products, isLoading } = useAsyncProducts(
    () => productRepository.findNewProducts(),
    'products-new',
  )

  return (
    <ProductListPage
      title="신상품"
      description="최근 등록된 상품을 모아보세요."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function ProductsBestPage() {
  const { products, isLoading } = useAsyncProducts(
    () => productRepository.findBestProducts(),
    'products-best',
  )

  return (
    <ProductListPage
      title="인기상품"
      description="많은 고객이 선택한 인기 상품입니다."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function ProductsSalePage() {
  const { products, isLoading } = useAsyncProducts(
    () => productRepository.findSaleProducts(),
    'products-sale',
  )

  return (
    <ProductListPage
      title="특가상품"
      description="할인 중인 특가 상품을 확인하세요."
      products={products}
      isLoading={isLoading}
    />
  )
}
