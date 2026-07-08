import {
  ProductImageGalleryManager,
  galleryImagesFromUrls,
  type ProductGalleryImage,
} from '../../ProductImageGalleryManager'
import { collectGalleryPhotos } from '../detailContent/detailContent'
import { adminSectionClassName } from '../adminFormStyles'

interface SellerPhotosStepProps {
  productId: string
  galleryImages: ProductGalleryImage[]
  onGalleryChange: (updater: (current: ProductGalleryImage[]) => ProductGalleryImage[]) => void
  initialPhotoUrls: string[]
}

export function SellerPhotosStep({
  productId,
  galleryImages,
  onGalleryChange,
  initialPhotoUrls,
}: SellerPhotosStepProps) {
  const images =
    galleryImages.length > 0 ? galleryImages : galleryImagesFromUrls(initialPhotoUrls)

  return (
    <div className={`${adminSectionClassName} space-y-4`}>
      <p className="text-sm text-neutral-600">
        사진을 드래그하거나 선택하세요. 첫 번째 사진이 대표 이미지입니다.
      </p>
      <ProductImageGalleryManager
        images={images}
        onChange={onGalleryChange}
        productId={productId}
        required
      />
    </div>
  )
}

export function getInitialPhotoUrlsFromForm(form: {
  thumbnail: string
  images: string[]
}): string[] {
  return collectGalleryPhotos(form as Parameters<typeof collectGalleryPhotos>[0])
}
