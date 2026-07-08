import type { Product } from '../../../types/product'
import { ProductImage } from '../ProductImage'
import { ProductDetailNotice } from './ProductDetailNotice'

interface ProductDetailInfoPanelProps {
  product: Product
}

export function ProductDetailInfoPanel({ product }: ProductDetailInfoPanelProps) {
  const detailMedia = product.detailMedia

  if (detailMedia.length === 0) {
    return (
      <ProductDetailNotice>
        상품 상세 이미지를 준비 중입니다.
      </ProductDetailNotice>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-2">
      {detailMedia.map((item) => (
        <div key={`${item.type}-${item.order}-${item.url}`} className="overflow-hidden rounded-2xl bg-neutral-100">
          {item.type === 'video' ? (
            <video
              src={item.url}
              controls
              playsInline
              preload="metadata"
              poster={item.thumbnail ?? undefined}
              className="h-auto w-full bg-black"
              style={{ width: '100%', height: 'auto' }}
              aria-label={`${product.name} 상세 영상 ${item.order + 1}`}
            />
          ) : (
            <ProductImage
              src={item.url}
              alt={`${product.name} 상세 이미지 ${item.order + 1}`}
              slug={product.slug}
              className="h-auto w-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  )
}
