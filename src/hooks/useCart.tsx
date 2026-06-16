import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { loadCartFromStorage, saveCartToStorage } from '../lib/cartStorage'
import { getSyncNoticeMessages, syncCartItems } from '../store/cartSync'
import * as cartStore from '../store/cartStore'
import type { AddToCartResult, CartItem } from '../types/cart'
import type { Product } from '../types/product'

interface CartContextValue {
  items: CartItem[]
  syncNotices: string[]
  addToCart: (product: Product) => AddToCartResult
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  syncCart: () => void
  clearSyncNotices: () => void
  getCartTotal: () => number
  getCartCount: () => number
  getCartTotalQuantity: () => number
  hasSoldOutItems: () => boolean
}

const CartContext = createContext<CartContextValue | null>(null)

function initializeCartState(): { items: CartItem[]; syncNotices: string[] } {
  const loaded = cartStore.normalizeCartItems(loadCartFromStorage())
  const synced = syncCartItems(loaded)

  return {
    items: synced.items,
    syncNotices: getSyncNoticeMessages(synced.notices),
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const initialState = useRef(initializeCartState()).current
  const [items, setItems] = useState<CartItem[]>(initialState.items)
  const [syncNotices, setSyncNotices] = useState<string[]>(initialState.syncNotices)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) {
      return
    }

    saveCartToStorage(items)
  }, [items, isReady])

  const applySync = useCallback((nextItems: CartItem[]) => {
    const synced = syncCartItems(nextItems)

    setSyncNotices(getSyncNoticeMessages(synced.notices))
    return synced.items
  }, [])

  const syncCart = useCallback(() => {
    setItems((prev) => applySync(prev))
  }, [applySync])

  const clearSyncNotices = useCallback(() => {
    setSyncNotices([])
  }, [])

  const addToCart = useCallback((product: Product): AddToCartResult => {
    const outcome = cartStore.addToCart(items, product)
    setItems(outcome.items)
    return outcome.result
  }, [items])

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => cartStore.removeFromCart(prev, productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => cartStore.updateQuantity(prev, productId, quantity))
  }, [])

  const clearCart = useCallback(() => {
    setItems(cartStore.clearCart())
    setSyncNotices([])
  }, [])

  const getCartTotal = useCallback(() => cartStore.getCartTotal(items), [items])

  const getCartCount = useCallback(() => cartStore.getCartCount(items), [items])

  const getCartTotalQuantity = useCallback(
    () => cartStore.getCartTotalQuantity(items),
    [items],
  )

  const hasSoldOutItems = useCallback(() => cartStore.hasSoldOutItems(items), [items])

  const value = useMemo(
    () => ({
      items,
      syncNotices,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      syncCart,
      clearSyncNotices,
      getCartTotal,
      getCartCount,
      getCartTotalQuantity,
      hasSoldOutItems,
    }),
    [
      items,
      syncNotices,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      syncCart,
      clearSyncNotices,
      getCartTotal,
      getCartCount,
      getCartTotalQuantity,
      hasSoldOutItems,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }

  return context
}
