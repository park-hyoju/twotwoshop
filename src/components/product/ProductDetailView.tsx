import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADD_TO_CART_MESSAGES } from '../../lib/cartMessages'
import { useCart } from '../../hooks/useCart'
import { formatPrice } from '../../lib/formatPrice'
import { ROUTES } from '../../lib/routes'
import type { Product } from '../../types/product'

interface ProductDetailViewProps {
  product: Product
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [cartMessage, setCartMessage] = useState('')
  const isSoldOut = product.stock === 0
  const hasDiscount = product.discountRate > 0

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
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div
          className="relative flex aspect-square items-center justify-center rounded-2xl bg-neutral-200 text-lg text-neutral-500"
          aria-label={`${product.name} 상품 이미지`}
        >
          상품 이미지
          {isSoldOut && (
            <span className="absolute left-4 top-4 rounded-lg bg-neutral-800 px-3 py-1.5 text-base font-semibold text-white">
              품절
            </span>
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
            <p className="mt-3 text-base text-neutral-500 sm:text-lg">{product.shortDescription}</p>
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

          <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
            {product.description}
          </p>

          <div className="flex flex-col gap-3 sm:max-w-md">
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
    </div>
  )
}
