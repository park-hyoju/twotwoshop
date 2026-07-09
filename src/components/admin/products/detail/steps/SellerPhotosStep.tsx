import {
  ProductImageGalleryManager,
  type ProductGalleryImage,
} from '../../ProductImageGalleryManager'
import { adminSectionClassName } from '../adminFormStyles'

interface SellerPhotosStepProps {
  productId: string
  galleryImages: ProductGalleryImage[]
  onGalleryChange: (updater: (current: ProductGalleryImage[]) => ProductGalleryImage[]) => void
}

export function SellerPhotosStep({
  productId,
  galleryImages,
  onGalleryChange,
}: SellerPhotosStepProps) {
  return (
    <div className={`${adminSectionClassName} space-y-4`}>
      <p className="text-sm text-neutral-600">
        사진을 드래그하거나 선택하세요. 첫 번째 사진이 대표 이미지입니다.
      </p>
      <ProductImageGalleryManager
        images={galleryImages}
        onChange={onGalleryChange}
        productId={productId}
        required
      />
    </div>
  )
}
