import type { Product, ProductVariant } from '../types/product'
import type { ProductOptionGroup } from '../types/productOptions'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeOptions(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, optionValue]) => [key.trim(), typeof optionValue === 'string' ? optionValue.trim() : ''])
      .filter(([key, optionValue]) => key && optionValue),
  )
}

function parseVariantStock(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value))
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed))
    }
  }

  return 0
}

export function parseOptionGroupsFromProductInfo(value: unknown): ProductOptionGroup[] {
  if (!isRecord(value) || !Array.isArray(value.optionGroups)) {
    return []
  }

  return value.optionGroups
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const name = typeof item.name === 'string' ? item.name.trim() : ''
      const values = Array.isArray(item.values)
        ? [...new Set(item.values.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean))]
        : []

      if (!name || values.length === 0) {
        return null
      }

      return { name, values }
    })
    .filter((item): item is ProductOptionGroup => item !== null)
}

export function inferOptionGroupsFromVariants(variants: ProductVariant[]): ProductOptionGroup[] {
  if (variants.length === 0) {
    return []
  }

  const hasGenericOptions = variants.some((variant) => Object.keys(variant.options ?? {}).length > 0)
  if (hasGenericOptions) {
    const names = new Set<string>()
    for (const variant of variants) {
      for (const name of Object.keys(variant.options ?? {})) {
        names.add(name)
      }
    }

    const preferredOrder = ['색상', '사이즈']
    const orderedNames = [
      ...preferredOrder.filter((name) => names.has(name)),
      ...[...names].filter((name) => !preferredOrder.includes(name)),
    ]

    return orderedNames.map((name) => ({
      name,
      values: [
        ...new Set(variants.map((variant) => variant.options?.[name] ?? '').filter(Boolean)),
      ],
    }))
  }

  const colors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))]
  const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))]
  const groups: ProductOptionGroup[] = []

  if (colors.length > 0) {
    groups.push({ name: '색상', values: colors })
  }

  if (sizes.length > 0) {
    groups.push({ name: '사이즈', values: sizes })
  }

  return groups
}

/** True when every option group name exists as a key on variant.options. */
export function optionGroupsAlignWithVariants(
  groups: ProductOptionGroup[],
  variants: ProductVariant[],
): boolean {
  if (groups.length === 0 || variants.length === 0) {
    return false
  }

  const optionKeys = new Set<string>()
  for (const variant of variants) {
    for (const key of Object.keys(variant.options ?? {})) {
      optionKeys.add(key)
    }
  }

  if (optionKeys.size === 0) {
    return false
  }

  return groups.every((group) => optionKeys.has(group.name))
}

/**
 * Prefer stored optionGroups only when their names match variant.options keys.
 * Admin row-based saves use color names as group names while variants use { 색상, 사이즈 }.
 */
export function resolveProductOptionGroups(
  storedGroups: ProductOptionGroup[],
  variants: ProductVariant[],
): ProductOptionGroup[] {
  if (optionGroupsAlignWithVariants(storedGroups, variants)) {
    return storedGroups
  }

  const inferred = inferOptionGroupsFromVariants(variants)
  return inferred.length > 0 ? inferred : storedGroups
}

export function parseProductVariants(value: unknown): ProductVariant[] {
  if (!isRecord(value) || !Array.isArray(value.variants)) {
    return []
  }

  return value.variants
    .map((item, index) => {
      if (!isRecord(item)) {
        return null
      }

      const options = normalizeOptions(item.options)
      const color = typeof item.color === 'string' ? item.color.trim() : ''
      const size = typeof item.size === 'string' ? item.size.trim() : ''
      const stock = parseVariantStock(item.stock)
      const extraPrice =
        typeof item.extraPrice === 'number' && Number.isFinite(item.extraPrice)
          ? Math.max(0, item.extraPrice)
          : 0
      const sku = typeof item.sku === 'string' ? item.sku.trim() : ''

      const resolvedOptions =
        Object.keys(options).length > 0
          ? options
          : Object.fromEntries(
              [
                color ? ['색상', color] : null,
                size ? ['사이즈', size] : null,
              ].filter((entry): entry is [string, string] => Boolean(entry)),
            )

      if (Object.keys(resolvedOptions).length === 0) {
        return null
      }

      const groupNames = Object.keys(resolvedOptions)
      const legacyColor = groupNames[0] ? resolvedOptions[groupNames[0]] ?? '' : color
      const legacySize = groupNames[1] ? resolvedOptions[groupNames[1]] ?? '' : size

      return {
        id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `variant-${index}`,
        options: resolvedOptions,
        stock,
        extraPrice,
        sku,
        color: legacyColor,
        size: legacySize,
      }
    })
    .filter((item): item is ProductVariant => item !== null)
}

export function hasProductOptions(product: Pick<Product, 'variants'>): boolean {
  return (product.variants?.length ?? 0) > 0
}

export function getProductOptionGroups(product: Pick<Product, 'optionGroups' | 'variants'>): ProductOptionGroup[] {
  return resolveProductOptionGroups(product.optionGroups, product.variants)
}

export function getOptionValuesForGroup(
  variants: ProductVariant[],
  groupName: string,
  selectedOptions: Record<string, string>,
  groups?: ProductOptionGroup[],
): string[] {
  const optionGroups = groups ?? inferOptionGroupsFromVariants(variants)
  const groupIndex = optionGroups.findIndex((group) => group.name === groupName)
  const priorGroupNames =
    groupIndex >= 0 ? optionGroups.slice(0, groupIndex).map((group) => group.name) : []

  const filtered = variants.filter((variant) =>
    priorGroupNames.every((name) => !selectedOptions[name] || variant.options[name] === selectedOptions[name]),
  )

  return [...new Set(filtered.map((variant) => variant.options[groupName] ?? '').filter(Boolean))]
}

export function findProductVariantByOptions(
  variants: ProductVariant[],
  selectedOptions: Record<string, string>,
): ProductVariant | undefined {
  const entries = Object.entries(selectedOptions).filter(([, value]) => value.trim())
  if (entries.length === 0) {
    return undefined
  }

  return variants.find((variant) =>
    entries.every(([name, value]) => variant.options[name] === value),
  )
}

export function findProductVariant(
  variants: ProductVariant[],
  color: string,
  size: string,
): ProductVariant | undefined {
  const byLegacy = variants.find((variant) => variant.color === color && variant.size === size)
  if (byLegacy) {
    return byLegacy
  }

  return findProductVariantByOptions(variants, {
    ...(color ? { 색상: color } : {}),
    ...(size ? { 사이즈: size } : {}),
  })
}

/** @deprecated use getOptionValuesForGroup */
export function getProductColors(variants: ProductVariant[]): string[] {
  return getOptionValuesForGroup(variants, '색상', {})
}

/** @deprecated use getOptionValuesForGroup */
export function getProductSizes(variants: ProductVariant[], color?: string): string[] {
  return getOptionValuesForGroup(variants, '사이즈', color ? { 색상: color } : {})
}

export function getProductOptionStock(
  product: Product,
  color: string,
  size: string,
  selectedOptions?: Record<string, string>,
): number {
  if (!hasProductOptions(product)) {
    return product.stock
  }

  const variant = selectedOptions
    ? findProductVariantByOptions(product.variants, selectedOptions)
    : findProductVariant(product.variants, color, size)

  return variant?.stock ?? 0
}

export function requiresColorSelection(variants: ProductVariant[]): boolean {
  return getProductOptionGroups({ optionGroups: [], variants }).some((group) => group.name === '색상')
}

export function requiresSizeSelection(variants: ProductVariant[]): boolean {
  return getProductOptionGroups({ optionGroups: [], variants }).some((group) => group.name === '사이즈')
}

export function isProductOptionSelectionComplete(
  product: Product,
  color: string,
  size: string,
  selectedOptions?: Record<string, string>,
): boolean {
  if (!hasProductOptions(product)) {
    return true
  }

  const groups = getProductOptionGroups(product)
  const options = selectedOptions ?? buildSelectedOptionsFromLegacy(color, size, groups)

  for (const group of groups) {
    if (!options[group.name]) {
      return false
    }
  }

  return Boolean(findProductVariantByOptions(product.variants, options))
}

export function buildSelectedOptionsFromLegacy(
  color: string,
  size: string,
  groups: ProductOptionGroup[],
): Record<string, string> {
  const options: Record<string, string> = {}

  if (groups[0] && color) {
    options[groups[0].name] = color
  }

  if (groups[1] && size) {
    options[groups[1].name] = size
  }

  return options
}

export function formatProductOptionLabel(color?: string, size?: string): string | null {
  const parts = [color?.trim(), size?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : null
}

export function formatSelectedOptionsLabel(selectedOptions: Record<string, string>): string | null {
  const preferredOrder = ['색상', '사이즈']
  const keys = [
    ...preferredOrder.filter((name) => selectedOptions[name]),
    ...Object.keys(selectedOptions).filter((name) => !preferredOrder.includes(name)),
  ]
  const parts = keys.map((name) => selectedOptions[name]?.trim() ?? '').filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : null
}

export function getLegacyColorSizeFromOptions(
  selectedOptions: Record<string, string>,
  groups: ProductOptionGroup[],
): { color: string; size: string } {
  if (selectedOptions['색상'] || selectedOptions['사이즈']) {
    return {
      color: selectedOptions['색상'] ?? '',
      size: selectedOptions['사이즈'] ?? '',
    }
  }

  const color = groups[0] ? selectedOptions[groups[0].name] ?? '' : ''
  const size = groups[1] ? selectedOptions[groups[1].name] ?? '' : ''
  return { color, size }
}
