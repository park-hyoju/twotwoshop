export {
  addToCart,
  clearCart,
  createCartItemFromProduct,
  getCartCount,
  getCartTotal,
  getCartTotalQuantity,
  getSoldOutCount,
  hasSoldOutItems,
  normalizeCartItems,
  removeFromCart,
  updateQuantity,
} from './cartStore'
export {
  canSubmitOrder,
  createOrder,
  generateOrderNumber,
  hasCheckoutFormErrors,
  validateCheckoutForm,
} from './orderStore'
