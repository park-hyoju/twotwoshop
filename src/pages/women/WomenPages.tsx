import { ProductListPage } from '../../components/product/ProductListPage'
import { useAsyncProducts } from '../../hooks/useAsyncProducts'
import { productRepository } from '../../services/productRepository'

export function WomenPage() {
  const { products, isLoading } = useAsyncProducts(
    () => productRepository.findProductsByCategory({ gender: 'women' }),
    'women-all',
  )

  return (
    <ProductListPage
      title="여성 전체"
      description="여성 의류 및 잡화 상품을 모아보세요."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function WomenTopsPage() {
  const { products, isLoading } = useAsyncProducts(
    () =>
      productRepository.findProductsByCategory({
        gender: 'women',
        displayCategory: 'top',
      }),
    'women-tops',
  )

  return (
    <ProductListPage
      title="여성 상의"
      description="여성 상의 상품 목록입니다."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function WomenBottomsPage() {
  const { products, isLoading } = useAsyncProducts(
    () =>
      productRepository.findProductsByCategory({
        gender: 'women',
        displayCategory: 'bottom',
      }),
    'women-bottoms',
  )

  return (
    <ProductListPage
      title="여성 하의"
      description="여성 하의 상품 목록입니다."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function WomenDressesPage() {
  const { products, isLoading } = useAsyncProducts(
    () =>
      productRepository.findProductsByCategory({
        gender: 'women',
        displayCategory: 'dress',
      }),
    'women-dresses',
  )

  return (
    <ProductListPage
      title="여성 원피스"
      description="여성 원피스 상품 목록입니다."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function WomenShoesPage() {
  const { products, isLoading } = useAsyncProducts(
    () =>
      productRepository.findProductsByCategory({
        gender: 'women',
        displayCategory: 'shoes',
      }),
    'women-shoes',
  )

  return (
    <ProductListPage
      title="여성 신발"
      description="여성 신발 상품 목록입니다."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function WomenMiscPage() {
  const { products, isLoading } = useAsyncProducts(
    () =>
      productRepository.findProductsByCategory({
        gender: 'women',
        displayCategory: 'misc',
      }),
    'women-misc',
  )

  return (
    <ProductListPage
      title="여성 잡화"
      description="여성 잡화 상품 목록입니다."
      products={products}
      isLoading={isLoading}
    />
  )
}
