import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADD_TO_CART_MESSAGES } from '../../lib/cartMessages'
import { useCart } from '../../hooks/useCart'
import { ROUTES } from '../../lib/routes'
import type { Product } from '../../types/product'
import { ProductDetailContent } from './detail/ProductDetailContent'
import { ProductImageCarousel } from './ProductImageCarousel'
import { ProductPriceDisplay } from './ProductPriceDisplay'

interface ProductDetailViewProps {
  product: Product
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [cartMessage, setCartMessage] = useState('')
  const isSoldOut = product.stock === 0

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
        <ProductImageCarousel product={product} isSoldOut={isSoldOut} />

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
          </div>

          <ProductPriceDisplay
            originalPrice={product.originalPrice}
            salePrice={product.price}
            size="detail"
          />

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

        <div className="lg:col-span-2">
          <ProductDetailContent product={product} />
        </div>
      </div>
    </div>
  )
}
