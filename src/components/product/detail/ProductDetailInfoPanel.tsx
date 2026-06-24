import { getDetailImageUrls } from '../../../lib/productIntroContent'
import type { Product } from '../../../types/product'
import { ProductImage } from '../ProductImage'
import { ProductDetailNotice } from './ProductDetailNotice'

interface ProductDetailInfoPanelProps {
  product: Product
}

export function ProductDetailInfoPanel({ product }: ProductDetailInfoPanelProps) {
  const detailImages = getDetailImageUrls(product.shortDescription, product.images)

  if (detailImages.length === 0) {
    return (
      <ProductDetailNotice>
        상품 상세 이미지를 준비 중입니다.
      </ProductDetailNotice>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      {detailImages.map((image, index) => (
        <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl bg-neutral-100">
          <ProductImage
            src={image}
            alt={`${product.name} 상세 이미지 ${index + 1}`}
            slug={product.slug}
            className="w-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}
