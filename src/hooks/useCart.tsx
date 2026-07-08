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
import type { AddToCartInput, AddToCartResult, CartItem } from '../types/cart'
import type { Product } from '../types/product'

interface CartContextValue {
  items: CartItem[]
  syncNotices: string[]
  isCartSyncing: boolean
  addToCart: (product: Product, options?: AddToCartInput) => AddToCartResult
  removeFromCart: (cartLineId: string) => void
  updateQuantity: (cartLineId: string, quantity: number) => void
  clearCart: () => void
  syncCart: () => Promise<void>
  clearSyncNotices: () => void
  getCartTotal: () => number
  getCartCount: () => number
  getCartTotalQuantity: () => number
  hasSoldOutItems: () => boolean
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() =>
    cartStore.normalizeCartItems(loadCartFromStorage()),
  )
  const [syncNotices, setSyncNotices] = useState<string[]>([])
  const [isCartSyncing, setIsCartSyncing] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const itemsRef = useRef(items)
  const syncRequestIdRef = useRef(0)

  itemsRef.current = items

  useEffect(() => {
    let cancelled = false
    const requestId = ++syncRequestIdRef.current

    async function initializeCart() {
      setIsCartSyncing(true)

      try {
        const loaded = cartStore.normalizeCartItems(loadCartFromStorage())
        const synced = await syncCartItems(loaded)

        if (cancelled || requestId !== syncRequestIdRef.current) {
          return
        }

        setItems(synced.items)
        setSyncNotices(getSyncNoticeMessages(synced.notices))
      } finally {
        if (!cancelled && requestId === syncRequestIdRef.current) {
          setIsCartSyncing(false)
          setIsReady(true)
        }
      }
    }

    void initializeCart()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isReady) {
      return
    }

    saveCartToStorage(items)
  }, [items, isReady])

  const syncCart = useCallback(async () => {
    const requestId = ++syncRequestIdRef.current
    setIsCartSyncing(true)

    try {
      const synced = await syncCartItems(
        cartStore.normalizeCartItems(itemsRef.current),
      )

      if (requestId !== syncRequestIdRef.current) {
        return
      }

      setItems(synced.items)
      setSyncNotices(getSyncNoticeMessages(synced.notices))
    } finally {
      if (requestId === syncRequestIdRef.current) {
        setIsCartSyncing(false)
      }
    }
  }, [])

  const clearSyncNotices = useCallback(() => {
    setSyncNotices([])
  }, [])

  const addToCart = useCallback(
    (product: Product, options?: AddToCartInput): AddToCartResult => {
      const outcome = cartStore.addToCart(itemsRef.current, product, options)
      itemsRef.current = outcome.items
      setItems(outcome.items)
      return outcome.result
    },
    [],
  )

  const removeFromCart = useCallback((cartLineId: string) => {
    setItems((prev) => cartStore.removeFromCart(prev, cartLineId))
  }, [])

  const updateQuantity = useCallback((cartLineId: string, quantity: number) => {
    setItems((prev) => cartStore.updateQuantity(prev, cartLineId, quantity))
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
      isCartSyncing,
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
      isCartSyncing,
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
