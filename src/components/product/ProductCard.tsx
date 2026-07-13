import { Link } from 'react-router-dom'
import { isPlaceholderProductImage } from '../../lib/productImageStorage'
import { getProductDetailPath } from '../../lib/productPaths'
import {
  getCustomerStockBadgeClassName,
  getCustomerStockLabel,
  isProductSoldOut,
} from '../../lib/productStock'
import type { Product } from '../../types/product'
import { ProductImage } from './ProductImage'
import { ProductPriceDisplay } from './ProductPriceDisplay'

interface ProductCardProps {
  product: Product
}

/** Prefer real thumbnail; if missing, use first real gallery image. */
function resolveProductCardImageSrc(product: Product): string {
  const thumbnail = product.thumbnail.trim()
  if (thumbnail && !isPlaceholderProductImage(thumbnail)) {
    return thumbnail
  }

  const firstImage = product.images.find((url) => {
    const trimmed = url.trim()
    return Boolean(trimmed) && !isPlaceholderProductImage(trimmed)
  })

  return firstImage?.trim() ?? ''
}

export function ProductCard({ product }: ProductCardProps) {
  const detailPath = getProductDetailPath(product.slug)
  const isSoldOut = isProductSoldOut(product)
  const stockLabel = getCustomerStockLabel(product.stock)
  const imageSrc = resolveProductCardImageSrc(product)

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <Link
        to={detailPath}
        className="relative block aspect-square overflow-hidden bg-neutral-100"
        aria-label={`${product.name} 상품 상세 보기`}
      >
        <ProductImage
          src={imageSrc}
          alt={product.name}
          slug={product.slug}
          className={`h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02] ${
            isSoldOut ? 'opacity-70' : ''
          }`}
        />
        {stockLabel && (
          <span
            className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-sm font-semibold ${getCustomerStockBadgeClassName(product.stock)}`}
          >
            {stockLabel}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <Link to={detailPath} className="hover:text-neutral-700">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-neutral-900 sm:text-lg">
            {product.name}
          </h3>
        </Link>

        <ProductPriceDisplay originalPrice={product.originalPrice} salePrice={product.price} />

        <Link
          to={detailPath}
          className="mt-auto flex min-h-14 w-full items-center justify-center rounded-xl bg-neutral-900 py-4 text-base font-semibold text-white transition-colors hover:bg-neutral-700 sm:text-lg"
        >
          상품보기
        </Link>
      </div>
    </article>
  )
}
