import type { AdminProductDetailForm, AdminProductOptionGroup, AdminProductVariant } from '../types/adminProductDetail'
import type { ProductStatus } from '../types/status'
import {
  formatAdminNumericInput,
  parseAdminNumericInput,
} from './adminNumericInput'
import { createOptionGroupId, createVariantId } from '../types/productOptions'

export function parseOptionValuesInput(input: string): string[] {
  const values = input
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter(Boolean)

  return [...new Set(values)]
}

/** Splits option tokens from name or value fields (comma, slash, newline). */
export function parseOptionTokens(input: string): string[] {
  return [...new Set(input.split(/[,/\n]/).map((value) => value.trim()).filter(Boolean))]
}

const DIMENSION_LABELS = new Set(['색상', '사이즈', 'color', 'colour', 'size'])

function canonicalDimensionLabel(name: string): string {
  const lower = name.trim().toLowerCase()
  if (lower === 'color' || lower === 'colour') {
    return '색상'
  }
  if (lower === 'size') {
    return '사이즈'
  }
  return name.trim()
}

function isDimensionLabel(name: string): boolean {
  return DIMENSION_LABELS.has(name.trim().toLowerCase()) || DIMENSION_LABELS.has(canonicalDimensionLabel(name))
}

function defaultDimensionName(index: number): string {
  return index === 0 ? '색상' : '사이즈'
}

function serializeOptionGroupsForCompare(groups: AdminProductOptionGroup[]): string {
  return JSON.stringify(
    groups.map((group) => ({
      name: group.name.trim(),
      valuesInput: group.valuesInput.trim(),
    })),
  )
}

/**
 * Normalizes admin option rows to a single convention:
 * - 옵션명 = 종류 (색상, 사이즈)
 * - 옵션값 = 실제 선택지 (네이비, 화이트 / 95, 100, 105)
 *
 * Misplaced color lists in the name field (e.g. "네이비/화이트" + values "95,100,105")
 * are expanded into 색상 × 사이즈 groups.
 */
export function normalizeOptionGroupsInput(
  groups: AdminProductOptionGroup[],
): AdminProductOptionGroup[] {
  const expanded: AdminProductOptionGroup[] = []

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index]
    const rawName = group.name.trim()
    const valueTokens = parseOptionValuesInput(group.valuesInput)
    const nameTokens = parseOptionTokens(rawName)

    if (nameTokens.length > 1 && !isDimensionLabel(rawName) && valueTokens.length > 0) {
      expanded.push({
        ...group,
        name: '색상',
        valuesInput: formatOptionValuesInput(nameTokens),
      })
      expanded.push({
        id: createOptionGroupId(),
        name: '사이즈',
        valuesInput: formatOptionValuesInput(valueTokens),
      })
      continue
    }

    if (nameTokens.length > 1 && !isDimensionLabel(rawName) && valueTokens.length === 0) {
      expanded.push({
        ...group,
        name: '색상',
        valuesInput: formatOptionValuesInput(nameTokens),
      })
      continue
    }

    if (!rawName && valueTokens.length > 0) {
      expanded.push({
        ...group,
        name: defaultDimensionName(index),
        valuesInput: group.valuesInput,
      })
      continue
    }

    if (rawName && valueTokens.length === 0) {
      // Keep in-progress groups (e.g. 사이즈 with empty values) so the second row does not vanish.
      expanded.push({
        ...group,
        name: isDimensionLabel(rawName) ? canonicalDimensionLabel(rawName) : rawName,
        valuesInput: '',
      })
      continue
    }

    if (rawName && valueTokens.length > 0) {
      expanded.push({
        ...group,
        name: isDimensionLabel(rawName) ? canonicalDimensionLabel(rawName) : rawName,
        valuesInput: group.valuesInput,
      })
    }
  }

  const merged = new Map<string, AdminProductOptionGroup>()
  for (const group of expanded) {
    const name = group.name.trim()
    const existing = merged.get(name)
    if (!existing) {
      merged.set(name, group)
      continue
    }

    const values = [
      ...new Set([
        ...parseOptionValuesInput(existing.valuesInput),
        ...parseOptionValuesInput(group.valuesInput),
      ]),
    ]
    merged.set(name, {
      ...existing,
      valuesInput: formatOptionValuesInput(values),
    })
  }

  const order = ['색상', '사이즈']
  return [...merged.values()].sort((left, right) => {
    const leftIndex = order.indexOf(left.name)
    const rightIndex = order.indexOf(right.name)
    if (leftIndex === -1 && rightIndex === -1) {
      return left.name.localeCompare(right.name, 'ko')
    }
    if (leftIndex === -1) {
      return 1
    }
    if (rightIndex === -1) {
      return -1
    }
    return leftIndex - rightIndex
  })
}

export function optionGroupsNeedNormalization(groups: AdminProductOptionGroup[]): boolean {
  const normalized = normalizeOptionGroupsInput(groups)
  return serializeOptionGroupsForCompare(groups) !== serializeOptionGroupsForCompare(normalized)
}

export function formatOptionValuesInput(values: string[]): string {
  return values.join(', ')
}

export function formatVariantOptionLabel(
  variant: AdminProductVariant,
  groupNames: string[],
): string {
  return groupNames
    .map((name) => variant.options[name] ?? '')
    .filter(Boolean)
    .join(' / ')
}

export function getVariantOptionKey(options: Record<string, string>): string {
  return Object.entries(options)
    .sort(([left], [right]) => left.localeCompare(right, 'ko'))
    .map(([name, value]) => `${name}=${value}`)
    .join('|')
}

export function cartesianCombinations(
  groups: Array<{ name: string; values: string[] }>,
): Array<Record<string, string>> {
  const activeGroups = groups.filter(
    (group) => group.name.trim() && group.values.some((value) => value.trim()),
  )

  if (activeGroups.length === 0) {
    return []
  }

  let combinations: Array<Record<string, string>> = [{}]

  for (const group of activeGroups) {
    const values = group.values.map((value) => value.trim()).filter(Boolean)
    if (values.length === 0) {
      continue
    }

    const next: Array<Record<string, string>> = []
    for (const combo of combinations) {
      for (const value of values) {
        next.push({ ...combo, [group.name.trim()]: value })
      }
    }
    combinations = next
  }

  return combinations
}

export function syncLegacyColorSize(
  variant: AdminProductVariant,
  groupNames: string[],
): AdminProductVariant {
  const color = groupNames[0] ? variant.options[groupNames[0]] ?? '' : ''
  const size = groupNames[1] ? variant.options[groupNames[1]] ?? '' : ''

  return {
    ...variant,
    color,
    size,
  }
}

export function normalizeAdminVariants(
  variants: AdminProductVariant[],
  groupNames: string[],
): AdminProductVariant[] {
  return variants.map((variant) => syncLegacyColorSize(variant, groupNames))
}

export function mergeVariantCombinations(
  existingVariants: AdminProductVariant[],
  combinations: Array<Record<string, string>>,
  groupNames: string[],
): AdminProductVariant[] {
  const existingByKey = new Map(
    existingVariants.map((variant) => [getVariantOptionKey(variant.options), variant]),
  )

  return combinations.map((options) => {
    const key = getVariantOptionKey(options)
    const previous = existingByKey.get(key)

    if (previous) {
      return syncLegacyColorSize({ ...previous, options }, groupNames)
    }

    return syncLegacyColorSize(
      {
        id: createVariantId(),
        options,
        stock: 0,
        extraPrice: 0,
        sku: '',
        color: '',
        size: '',
      },
      groupNames,
    )
  })
}

export function getVariantTotalStock(variants: AdminProductVariant[]): number {
  return variants.reduce((sum, variant) => sum + Math.max(0, variant.stock ?? 0), 0)
}

export function resolveVariantStockFromDraft(
  row: AdminProductVariant,
  draft: Record<string, string>,
): number {
  if (!(row.id in draft)) {
    return row.stock
  }

  const draftValue = draft[row.id]
  const baselineDisplay = formatAdminNumericInput(row.stock)

  // Unchanged draft (including 0 displayed as empty) keeps existing stock.
  if (draftValue === baselineDisplay) {
    return row.stock
  }

  return parseAdminNumericInput(draftValue)
}

export function resolveVariantStocksFromDraft(
  rows: AdminProductVariant[],
  draft: Record<string, string>,
): AdminProductVariant[] {
  return rows.map((row) => ({
    ...row,
    stock: resolveVariantStockFromDraft(row, draft),
  }))
}

export function getDisplayedVariantTotalStock(
  rows: AdminProductVariant[],
  draft: Record<string, string>,
): number {
  return getVariantTotalStock(resolveVariantStocksFromDraft(rows, draft))
}

export function inferOptionGroupsFromVariants(
  variants: AdminProductVariant[],
): AdminProductOptionGroup[] {
  if (variants.length === 0) {
    return []
  }

  const hasGenericOptions = variants.some(
    (variant) => Object.keys(variant.options ?? {}).length > 0,
  )

  if (hasGenericOptions) {
    const names = new Set<string>()
    for (const variant of variants) {
      for (const name of Object.keys(variant.options ?? {})) {
        names.add(name)
      }
    }

    return [...names].map((name) => ({
      id: createOptionGroupId(),
      name,
      valuesInput: formatOptionValuesInput([
        ...new Set(variants.map((variant) => variant.options?.[name] ?? '').filter(Boolean)),
      ]),
    }))
  }

  const colors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))]
  const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))]
  const groups: AdminProductOptionGroup[] = []

  if (colors.length > 0) {
    groups.push({
      id: createOptionGroupId(),
      name: '색상',
      valuesInput: formatOptionValuesInput(colors),
    })
  }

  if (sizes.length > 0) {
    groups.push({
      id: createOptionGroupId(),
      name: '사이즈',
      valuesInput: formatOptionValuesInput(sizes),
    })
  }

  return groups
}

export function variantsFromLegacyRows(
  variants: Array<{
    id?: string
    color?: string
    size?: string
    stock?: number
    extraPrice?: number
    sku?: string
    options?: Record<string, string>
  }>,
  groupNames: string[],
): AdminProductVariant[] {
  return variants.map((variant) => {
    const options =
      variant.options && Object.keys(variant.options).length > 0
        ? variant.options
        : Object.fromEntries(
            [
              groupNames[0] ? [groupNames[0], variant.color ?? ''] : null,
              groupNames[1] ? [groupNames[1], variant.size ?? ''] : null,
            ].filter((entry): entry is [string, string] => Boolean(entry)),
          )

    return syncLegacyColorSize(
      {
        id: variant.id?.trim() || createVariantId(),
        options,
        stock:
          typeof variant.stock === 'number' && Number.isFinite(variant.stock)
            ? Math.max(0, variant.stock)
            : 0,
        extraPrice:
          typeof variant.extraPrice === 'number' && Number.isFinite(variant.extraPrice)
            ? Math.max(0, variant.extraPrice)
            : 0,
        sku: typeof variant.sku === 'string' ? variant.sku : '',
        color: variant.color ?? '',
        size: variant.size ?? '',
      },
      groupNames,
    )
  })
}

export function buildOptionGroupsPayload(groups: AdminProductOptionGroup[]) {
  const normalized = normalizeOptionGroupsInput(groups)

  return normalized
    .map((group) => ({
      id: group.id,
      name: group.name.trim(),
      values: parseOptionValuesInput(group.valuesInput),
    }))
    .filter((group) => group.name && group.values.length > 0)
}

export function buildVariantsFromOptionGroups(
  groups: AdminProductOptionGroup[],
  existingVariants: AdminProductVariant[],
  stockByVariantId?: Record<string, number>,
): AdminProductVariant[] {
  const normalizedGroups = normalizeOptionGroupsInput(groups)
  const payload = buildOptionGroupsPayload(normalizedGroups)
  if (payload.length === 0) {
    return []
  }

  const combinations = cartesianCombinations(payload)
  const groupNames = payload.map((group) => group.name)
  const existingWithStock = existingVariants.map((variant) => ({
    ...variant,
    stock: stockByVariantId?.[variant.id] ?? variant.stock,
  }))

  return mergeVariantCombinations(existingWithStock, combinations, groupNames)
}

export function cloneOptionGroupsForNewProduct(
  groups: AdminProductOptionGroup[],
): AdminProductOptionGroup[] {
  return groups.map((group) => ({
    ...group,
    id: createOptionGroupId(),
  }))
}

export function cloneVariantsForNewProduct(variants: AdminProductVariant[]): AdminProductVariant[] {
  return variants.map((variant) => ({
    ...variant,
    id: createVariantId(),
  }))
}

export function applyVariantStatusSync(form: AdminProductDetailForm): AdminProductDetailForm {
  if (form.variants.length === 0) {
    return form
  }

  const totalStock = getVariantTotalStock(form.variants)
  const status: ProductStatus =
    totalStock === 0
      ? 'soldout'
      : form.status === 'hidden'
        ? 'hidden'
        : 'active'

  return {
    ...form,
    stock: totalStock,
    status,
  }
}
