import { ProductListPage } from '../../components/product/ProductListPage'
import { useAsyncProducts } from '../../hooks/useAsyncProducts'
import {
  getProductCategoryDefinition,
  PRODUCT_CATEGORY_GROUP_LABELS,
  type ProductCategoryGroup,
  type ProductCategoryId,
} from '../../constants/productCategories'
import { productRepository } from '../../services/productRepository'

export function createCategoryProductPage(categoryId: ProductCategoryId) {
  const definition = getProductCategoryDefinition(categoryId)
  const groupLabel = PRODUCT_CATEGORY_GROUP_LABELS[definition.group]

  return function CategoryProductPage() {
    const { products, isLoading } = useAsyncProducts(
      () => productRepository.findProductsByProductCategory(categoryId),
      `category-${categoryId}`,
    )

    return (
      <ProductListPage
        title={definition.group === 'common' ? definition.label : `${groupLabel} ${definition.label}`}
        description={`${definition.group === 'common' ? '' : `${groupLabel} `}${definition.label} 상품 목록입니다.`}
        products={products}
        isLoading={isLoading}
      />
    )
  }
}

export function createCategoryGroupProductPage(
  group: ProductCategoryGroup,
  title: string,
  description: string,
) {
  return function CategoryGroupProductPage() {
    const { products, isLoading } = useAsyncProducts(
      () => productRepository.findProductsByCategoryGroup(group),
      `${group}-all`,
    )

    return (
      <ProductListPage
        title={title}
        description={description}
        products={products}
        isLoading={isLoading}
      />
    )
  }
}
