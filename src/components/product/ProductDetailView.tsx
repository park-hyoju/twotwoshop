import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADD_TO_CART_MESSAGES } from '../../lib/cartMessages'
import { useCart } from '../../hooks/useCart'
import { formatPrice } from '../../lib/formatPrice'
import { ROUTES } from '../../lib/routes'
import type { Product } from '../../types/product'
import { ProductDetailContent } from './detail/ProductDetailContent'
import { ProductImage } from './ProductImage'

interface ProductDetailViewProps {
  product: Product
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [cartMessage, setCartMessage] = useState('')
  const [activeImage, setActiveImage] = useState(product.thumbnail)
  const isSoldOut = product.stock === 0
  const hasDiscount = product.discountRate > 0
  const galleryImages =
    product.images.length > 0 ? product.images : [product.thumbnail]

  useEffect(() => {
    setActiveImage(product.thumbnail)
  }, [product.thumbnail, product.slug])

  const handleAddToCart = () => {
    const result = addToCart(product)
    setCartMessage(ADD_TO_CART_MESSAGES[result])

    if (result === 'success') {
      window.setTimeout(() => setCartMessage(''), 2500)
    }
  }

  const handleBuyNow = () => {
    const result = addToCart(product)

    if (result === 'success') {
      navigate(ROUTES.cart)
      return
    }

    setCartMessage(ADD_TO_CART_MESSAGES[result])
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <div
            className="relative overflow-hidden rounded-2xl bg-neutral-100"
            aria-label={`${product.name} 상품 이미지`}
          >
            <div className="aspect-square">
              <ProductImage
                src={activeImage}
                alt={product.name}
                slug={product.slug}
                className={`h-full w-full object-cover ${isSoldOut ? 'opacity-70' : ''}`}
              />
            </div>
            {isSoldOut && (
              <span className="absolute left-4 top-4 rounded-lg bg-neutral-800 px-3 py-1.5 text-base font-semibold text-white">
                품절
              </span>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {galleryImages.map((image, index) => {
                const isActive = image === activeImage

                return (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className={`overflow-hidden rounded-xl border bg-neutral-100 transition-colors ${
                      isActive
                        ? 'border-neutral-900 ring-2 ring-neutral-900/20'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                    aria-label={`상세 이미지 ${index + 1} 보기`}
                    aria-pressed={isActive}
                  >
                    <div className="aspect-square">
                      <ProductImage
                        src={image}
                        alt={`${product.name} 상세 이미지 ${index + 1}`}
                        slug={product.slug}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {isSoldOut && (
              <span className="rounded-md bg-neutral-700 px-3 py-1.5 text-sm font-semibold text-white">
                품절
              </span>
            )}
            {product.isNew && (
              <span className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">
                신상품
              </span>
            )}
            {product.isBest && (
              <span className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white">
                인기상품
              </span>
            )}
            {product.isSale && (
              <span className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">
                특가상품
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">{product.name}</h1>
            {product.shortDescription && (
              <p className="mt-3 text-base text-neutral-500 sm:text-lg">{product.shortDescription}</p>
            )}
          </div>

          <div className="space-y-2">
            {hasDiscount && (
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-red-600">{product.discountRate}%</span>
                <span className="text-lg text-neutral-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              </div>
            )}
            <p className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:max-w-md">
            <button
              type="button"
              disabled={isSoldOut}
              onClick={handleAddToCart}
              className="min-h-14 w-full rounded-xl bg-neutral-900 py-4 text-lg font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              {isSoldOut ? '품절' : '장바구니 담기'}
            </button>

            <button
              type="button"
              disabled={isSoldOut}
              onClick={handleBuyNow}
              className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white py-4 text-lg font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
            >
              구매하기
            </button>

            {cartMessage && (
              <p
                role="status"
                aria-live="polite"
                className="rounded-xl bg-neutral-100 px-4 py-3 text-center text-base font-semibold text-neutral-800 sm:text-lg"
              >
                {cartMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <ProductDetailContent product={product} />
    </div>
  )
}
