import { ProductListPage } from '../../components/product/ProductListPage'
import { useAsyncProducts } from '../../hooks/useAsyncProducts'
import { productRepository } from '../../services/productRepository'

export function MenPage() {
  const { products, isLoading } = useAsyncProducts(
    () => productRepository.findProductsByCategory({ gender: 'men' }),
    'men-all',
  )

  return (
    <ProductListPage
      title="남성 전체"
      description="남성 의류 및 잡화 상품을 모아보세요."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function MenTopsPage() {
  const { products, isLoading } = useAsyncProducts(
    () =>
      productRepository.findProductsByCategory({
        gender: 'men',
        displayCategory: 'top',
      }),
    'men-tops',
  )

  return (
    <ProductListPage
      title="남성 상의"
      description="남성 상의 상품 목록입니다."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function MenBottomsPage() {
  const { products, isLoading } = useAsyncProducts(
    () =>
      productRepository.findProductsByCategory({
        gender: 'men',
        displayCategory: 'bottom',
      }),
    'men-bottoms',
  )

  return (
    <ProductListPage
      title="남성 하의"
      description="남성 하의 상품 목록입니다."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function MenShoesPage() {
  const { products, isLoading } = useAsyncProducts(
    () =>
      productRepository.findProductsByCategory({
        gender: 'men',
        displayCategory: 'shoes',
      }),
    'men-shoes',
  )

  return (
    <ProductListPage
      title="남성 신발"
      description="남성 신발 상품 목록입니다."
      products={products}
      isLoading={isLoading}
    />
  )
}

export function MenMiscPage() {
  const { products, isLoading } = useAsyncProducts(
    () =>
      productRepository.findProductsByCategory({
        gender: 'men',
        displayCategory: 'misc',
      }),
    'men-misc',
  )

  return (
    <ProductListPage
      title="남성 잡화"
      description="남성 잡화 상품 목록입니다."
      products={products}
      isLoading={isLoading}
    />
  )
}
