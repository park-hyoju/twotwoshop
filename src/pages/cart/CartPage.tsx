import { useEffect } from 'react'
import { CartEmpty, CartItemRow, CartSummary, CartSyncNotices } from '../../components/cart'
import { useCart } from '../../hooks/useCart'

export function CartPage() {
  const {
    items,
    syncNotices,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCart,
    clearSyncNotices,
    getCartTotal,
    getCartCount,
    getCartTotalQuantity,
    hasSoldOutItems,
  } = useCart()

  useEffect(() => {
    syncCart()
  }, [syncCart])

  const total = getCartTotal()
  const itemCount = getCartCount()
  const totalQuantity = getCartTotalQuantity()
  const soldOutIncluded = hasSoldOutItems()

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">장바구니</h1>
          <p className="mt-4 text-lg text-neutral-600 sm:text-xl">담아두신 상품을 확인하세요.</p>
          {items.length > 0 && (
            <p className="mt-2 text-base text-neutral-500 sm:text-lg">총 {totalQuantity}개 상품</p>
          )}
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="min-h-12 self-start rounded-xl border border-neutral-300 px-5 text-base font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 sm:text-lg"
          >
            장바구니 비우기
          </button>
        )}
      </div>

      <CartSyncNotices notices={syncNotices} onDismiss={clearSyncNotices} />

      {items.length === 0 ? (
        <div className="mt-10">
          <CartEmpty />
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.productId}>
                <CartItemRow
                  item={item}
                  onDecrease={() => updateQuantity(item.productId, item.quantity - 1)}
                  onIncrease={() => updateQuantity(item.productId, item.quantity + 1)}
                  onRemove={() => removeFromCart(item.productId)}
                />
              </li>
            ))}
          </ul>

          <CartSummary
            total={total}
            itemCount={itemCount}
            totalQuantity={totalQuantity}
            hasSoldOutItems={soldOutIncluded}
          />
        </div>
      )}
    </div>
  )
}
