/**
 * Returns discount percent when original price is higher than sale price.
 * Otherwise returns null (no discount to display).
 */
export function calculateDiscountRate(
  originalPrice: number,
  salePrice: number,
): number | null {
  if (originalPrice <= 0 || salePrice <= 0 || salePrice >= originalPrice) {
    return null
  }

  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

/** Persisted discount_rate field uses 0 when there is no discount. */
export function calculateDiscountRateForStorage(
  originalPrice: number,
  salePrice: number,
): number {
  return calculateDiscountRate(originalPrice, salePrice) ?? 0
}
