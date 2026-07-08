import type { Product, ProductVariant } from '../types/product'

export function parseProductVariants(value: unknown): ProductVariant[] {
  if (typeof value !== 'object' || value === null) {
    return []
  }

  const record = value as Record<string, unknown>
  if (!Array.isArray(record.variants)) {
    return []
  }

  return record.variants
    .map((item, index) => {
      if (typeof item !== 'object' || item === null) {
        return null
      }

      const row = item as Record<string, unknown>
      const color = typeof row.color === 'string' ? row.color.trim() : ''
      const size = typeof row.size === 'string' ? row.size.trim() : ''
      const stock =
        typeof row.stock === 'number' && Number.isFinite(row.stock) ? Math.max(0, row.stock) : 0

      if (!color && !size) {
        return null
      }

      return {
        id: typeof row.id === 'string' && row.id.trim() ? row.id.trim() : `variant-${index}`,
        color,
        size,
        stock,
      }
    })
    .filter((item): item is ProductVariant => item !== null)
}

export function hasProductOptions(product: Pick<Product, 'variants'>): boolean {
  return (product.variants?.length ?? 0) > 0
}

export function getProductColors(variants: ProductVariant[]): string[] {
  return [...new Set(variants.map((variant) => variant.color).filter(Boolean))]
}

export function getProductSizes(variants: ProductVariant[], color?: string): string[] {
  const filtered = color
    ? variants.filter((variant) => variant.color === color)
    : variants

  return [...new Set(filtered.map((variant) => variant.size).filter(Boolean))]
}

export function findProductVariant(
  variants: ProductVariant[],
  color: string,
  size: string,
): ProductVariant | undefined {
  return variants.find((variant) => variant.color === color && variant.size === size)
}

export function getProductOptionStock(product: Product, color: string, size: string): number {
  if (!hasProductOptions(product)) {
    return product.stock
  }

  const variant = findProductVariant(product.variants, color, size)
  return variant?.stock ?? 0
}

export function requiresColorSelection(variants: ProductVariant[]): boolean {
  return variants.some((variant) => variant.color.length > 0)
}

export function requiresSizeSelection(variants: ProductVariant[]): boolean {
  return variants.some((variant) => variant.size.length > 0)
}

export function isProductOptionSelectionComplete(
  product: Product,
  color: string,
  size: string,
): boolean {
  if (!hasProductOptions(product)) {
    return true
  }

  if (requiresColorSelection(product.variants) && !color) {
    return false
  }

  if (requiresSizeSelection(product.variants) && !size) {
    return false
  }

  return Boolean(findProductVariant(product.variants, color, size))
}

export function formatProductOptionLabel(color?: string, size?: string): string | null {
  const parts = [color?.trim(), size?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : null
}
