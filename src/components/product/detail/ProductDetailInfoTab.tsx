import { getProductDescriptionText } from '../../../lib/productDetailContent'
import type { Product } from '../../../types/product'
import { ProductDetailDescriptionSection } from './ProductDetailDescriptionSection'
import { ProductDetailInfoPanel } from './ProductDetailInfoPanel'

interface ProductDetailInfoTabProps {
  product: Product
}

export function ProductDetailInfoTab({ product }: ProductDetailInfoTabProps) {
  const hasDescription = Boolean(
    getProductDescriptionText(product.shortDescription, product.description).trim(),
  )

  return (
    <div className="space-y-8">
      {hasDescription && (
        <ProductDetailDescriptionSection
          shortDescription={product.shortDescription}
          description={product.description}
        />
      )}

      <ProductDetailInfoPanel product={product} />
    </div>
  )
}
