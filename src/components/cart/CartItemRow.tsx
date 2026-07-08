import { Link } from 'react-router-dom'
import { getCartOptionLabel } from '../../lib/cartLine'
import { isCartItemAvailable } from '../../lib/cartItem'
import { formatPrice } from '../../lib/formatPrice'
import { getProductDetailPath } from '../../lib/productPaths'
import type { CartItem } from '../../types/cart'

interface CartItemRowProps {
  item: CartItem
  onDecrease: () => void
  onIncrease: () => void
  onRemove: () => void
}

export function CartItemRow({ item, onDecrease, onIncrease, onRemove }: CartItemRowProps) {
  const isSoldOut = !isCartItemAvailable(item)
  const isMaxQuantity = !isSoldOut && item.quantity >= item.stock
  const optionLabel = getCartOptionLabel(item)

  return (
    <article
      className={`rounded-2xl border bg-white p-4 sm:p-5 ${
        isSoldOut ? 'border-neutral-300 bg-neutral-50' : 'border-neutral-200'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Link
          to={getProductDetailPath(item.slug)}
          className="relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-200 text-base text-neutral-500 sm:h-28 sm:w-28"
          aria-label={`${item.name} 상품 상세 보기`}
        >
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt=""
              className={`h-full w-full object-cover ${isSoldOut ? 'opacity-60' : ''}`}
            />
          ) : (
            '상품 이미지'
          )}
          {isSoldOut && (
            <span className="absolute left-2 top-2 rounded-md bg-neutral-800 px-2.5 py-1 text-sm font-semibold text-white">
              품절
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={getProductDetailPath(item.slug)}
                className="text-lg font-semibold text-neutral-900 hover:text-neutral-700 sm:text-xl"
              >
                {item.name}
              </Link>
              {isSoldOut && (
                <span className="rounded-md bg-neutral-700 px-2.5 py-1 text-sm font-semibold text-white">
                  품절
                </span>
              )}
            </div>
            {optionLabel && (
              <p className="mt-1 text-sm text-neutral-600">옵션: {optionLabel}</p>
            )}
            <p className="mt-2 text-xl font-bold text-neutral-900 sm:text-2xl">
              {formatPrice(item.price)}
            </p>
            {isSoldOut && (
              <p className="mt-2 text-base text-red-600 sm:text-lg">
                품절 상품은 주문할 수 없습니다.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base text-neutral-600 sm:text-lg">수량</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onDecrease}
                  disabled={isSoldOut || item.quantity <= 1}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-300 text-xl font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`${item.name} 수량 줄이기`}
                >
                  −
                </button>
                <span className="min-w-10 text-center text-lg font-semibold text-neutral-900 sm:text-xl">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={onIncrease}
                  disabled={isSoldOut || isMaxQuantity}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-300 text-xl font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`${item.name} 수량 늘리기`}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
              <p className="text-lg font-bold text-neutral-900 sm:text-xl">
                {formatPrice(item.price * item.quantity)}
              </p>
              <button
                type="button"
                onClick={onRemove}
                className="min-h-12 rounded-xl border border-neutral-300 px-4 text-base font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 sm:text-lg"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
