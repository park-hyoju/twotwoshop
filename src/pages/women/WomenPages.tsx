import {
  getProductsByDisplayCategory,
  getProductsByGender,
} from '../../services/productService'
import { ProductListPage } from '../../components/product/ProductListPage'

export function WomenPage() {
  return (
    <ProductListPage
      title="여성 전체"
      description="여성 의류 및 잡화 상품을 모아보세요."
      products={getProductsByGender('women')}
    />
  )
}

export function WomenTopsPage() {
  return (
    <ProductListPage
      title="여성 상의"
      description="여성 상의 상품 목록입니다."
      products={getProductsByDisplayCategory('women', 'top')}
    />
  )
}

export function WomenBottomsPage() {
  return (
    <ProductListPage
      title="여성 하의"
      description="여성 하의 상품 목록입니다."
      products={getProductsByDisplayCategory('women', 'bottom')}
    />
  )
}

export function WomenDressesPage() {
  return (
    <ProductListPage
      title="여성 원피스"
      description="여성 원피스 상품 목록입니다."
      products={getProductsByDisplayCategory('women', 'dress')}
    />
  )
}

export function WomenShoesPage() {
  return (
    <ProductListPage
      title="여성 신발"
      description="여성 신발 상품 목록입니다."
      products={getProductsByDisplayCategory('women', 'shoes')}
    />
  )
}

export function WomenMiscPage() {
  return (
    <ProductListPage
      title="여성 잡화"
      description="여성 잡화 상품 목록입니다."
      products={getProductsByDisplayCategory('women', 'misc')}
    />
  )
}
