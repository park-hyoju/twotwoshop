import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADD_TO_CART_MESSAGES } from '../../lib/cartMessages'
import { useCart } from '../../hooks/useCart'
import { ROUTES } from '../../lib/routes'
import {
  getCustomerStockBadgeClassName,
  getCustomerStockLabel,
  isProductSoldOut,
} from '../../lib/productStock'
import type { Product } from '../../types/product'
import { ProductDetailContent } from './detail/ProductDetailContent'
import { ProductRecommendedSection } from './detail/ProductRecommendedSection'
import { ProductSoldOutNotice } from './detail/ProductSoldOutNotice'
import { ProductImageCarousel } from './ProductImageCarousel'
import { ProductPriceDisplay } from './ProductPriceDisplay'

interface ProductDetailViewProps {
  product: Product
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [cartMessage, setCartMessage] = useState('')
  const isSoldOut = isProductSoldOut(product)
  const stockLabel = getCustomerStockLabel(product.stock)

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
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-16">
        <ProductImageCarousel product={product} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {stockLabel && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide sm:text-sm ${
                  isSoldOut
                    ? 'bg-neutral-900 text-white'
                    : getCustomerStockBadgeClassName(product.stock)
                }`}
              >
                {stockLabel}
              </span>
            )}
            {product.isNew && (
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white sm:text-sm">
                신상품
              </span>
            )}
            {product.isBest && (
              <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white sm:text-sm">
                인기상품
              </span>
            )}
            {product.isSale && (
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white sm:text-sm">
                특가상품
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              {product.name}
            </h1>
          </div>

          <ProductPriceDisplay
            originalPrice={product.originalPrice}
            salePrice={product.price}
            size="detail"
          />

          {isSoldOut ? (
            <div className="lg:max-w-md">
              <ProductSoldOutNotice product={product} />
            </div>
          ) : (
            <div className="flex flex-col gap-3 lg:max-w-md">
              <button
                type="button"
                onClick={handleAddToCart}
                className="min-h-14 w-full rounded-xl bg-neutral-900 py-4 text-lg font-semibold text-white transition-colors hover:bg-neutral-700"
              >
                장바구니 담기
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white py-4 text-lg font-semibold text-neutral-800 transition-colors hover:bg-neutral-100"
              >
                구매하기
              </button>

              {cartMessage && (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center text-base font-medium text-neutral-800 sm:text-lg"
                >
                  {cartMessage}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <ProductDetailContent product={product} />
        </div>
      </div>

      {isSoldOut && (
        <div className="mt-12 sm:mt-16">
          <ProductRecommendedSection product={product} />
        </div>
      )}
    </div>
  )
}
