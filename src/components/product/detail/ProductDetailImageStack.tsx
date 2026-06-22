import { getDetailStackImages } from '../../../lib/productDetailImages'
import type { Product } from '../../../types/product'
import { ProductImage } from '../ProductImage'

interface ProductDetailImageStackProps {
  product: Product
}

export function ProductDetailImageStack({ product }: ProductDetailImageStackProps) {
  const detailImages = getDetailStackImages(product.images)

  if (detailImages.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {detailImages.map((image, index) => (
        <div key={`${image}-${index}`} className="overflow-hidden bg-neutral-100">
          <ProductImage
            src={image}
            alt={`${product.name} 상세 이미지 ${index + 1}`}
            slug={product.slug}
            className="block w-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}
