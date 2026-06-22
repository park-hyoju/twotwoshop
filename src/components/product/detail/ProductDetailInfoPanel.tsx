import {
  getProductDescriptionText,
  hasProductInfoFields,
  hasProductSizeGuide,
} from '../../../lib/productDetailContent'
import { getDetailStackImages } from '../../../lib/productDetailImages'
import type { Product } from '../../../types/product'
import { ProductDetailDescriptionSection } from './ProductDetailDescriptionSection'
import { ProductDetailImageStack } from './ProductDetailImageStack'
import { ProductDetailInfoSection } from './ProductDetailInfoSection'
import { ProductDetailNotice } from './ProductDetailNotice'
import { ProductDetailSizeGuideSection } from './ProductDetailSizeGuideSection'

interface ProductDetailInfoPanelProps {
  product: Product
}

const SUBHEADING_CLASS_NAME = 'text-base font-bold text-neutral-900'

export function ProductDetailInfoPanel({ product }: ProductDetailInfoPanelProps) {
  const detailImages = getDetailStackImages(product.images)
  const descriptionText = getProductDescriptionText(
    product.shortDescription,
    product.description,
  )
  const showSizeGuide = hasProductSizeGuide(product.sizeGuide)
  const showProductInfo = hasProductInfoFields(product.productInfo)
  const hasAnyContent =
    detailImages.length > 0 || Boolean(descriptionText) || showSizeGuide || showProductInfo

  if (!hasAnyContent) {
    return (
      <ProductDetailNotice>
        상품 상세 정보를 준비 중입니다. 잠시 후 다시 확인해주세요.
      </ProductDetailNotice>
    )
  }

  return (
    <div className="space-y-8">
      {detailImages.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <ProductDetailImageStack product={product} />
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className={SUBHEADING_CLASS_NAME}>상품 상세 설명</h3>
        <div className="mt-4">
          {descriptionText ? (
            <ProductDetailDescriptionSection
              shortDescription={product.shortDescription}
              description={product.description}
            />
          ) : (
            <ProductDetailNotice>
              상품 상세 설명이 등록되지 않았습니다.
            </ProductDetailNotice>
          )}
        </div>
      </div>

      {showSizeGuide && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
          <h3 className={SUBHEADING_CLASS_NAME}>사이즈 가이드</h3>
          <div className="mt-4">
            <ProductDetailSizeGuideSection sizeGuide={product.sizeGuide} />
          </div>
        </div>
      )}

      {showProductInfo && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
          <h3 className={SUBHEADING_CLASS_NAME}>상품 정보</h3>
          <div className="mt-4">
            <ProductDetailInfoSection productInfo={product.productInfo} />
          </div>
        </div>
      )}
    </div>
  )
}
