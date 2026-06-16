import {
  getProductsByDisplayCategory,
  getProductsByGender,
} from '../../services/productService'
import { ProductListPage } from '../../components/product/ProductListPage'

export function MenPage() {
  return (
    <ProductListPage
      title="남성 전체"
      description="남성 의류 및 잡화 상품을 모아보세요."
      products={getProductsByGender('men')}
    />
  )
}

export function MenTopsPage() {
  return (
    <ProductListPage
      title="남성 상의"
      description="남성 상의 상품 목록입니다."
      products={getProductsByDisplayCategory('men', 'top')}
    />
  )
}

export function MenBottomsPage() {
  return (
    <ProductListPage
      title="남성 하의"
      description="남성 하의 상품 목록입니다."
      products={getProductsByDisplayCategory('men', 'bottom')}
    />
  )
}

export function MenShoesPage() {
  return (
    <ProductListPage
      title="남성 신발"
      description="남성 신발 상품 목록입니다."
      products={getProductsByDisplayCategory('men', 'shoes')}
    />
  )
}

export function MenMiscPage() {
  return (
    <ProductListPage
      title="남성 잡화"
      description="남성 잡화 상품 목록입니다."
      products={getProductsByDisplayCategory('men', 'misc')}
    />
  )
}
