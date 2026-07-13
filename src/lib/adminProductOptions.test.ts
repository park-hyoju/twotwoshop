import { describe, expect, it } from 'vitest'
import {
  buildRowBasedColorSizeCombinations,
  buildVariantsFromOptionGroups,
  cartesianCombinations,
  cloneVariantsForNewProduct,
  formatVariantOptionLabel,
  getDisplayedVariantTotalStock,
  getVariantOptionKey,
  getVariantTotalStock,
  mergeVariantCombinations,
  normalizeOptionGroupsInput,
  parseOptionTokens,
  parseOptionValuesInput,
  resolveVariantStocksFromDraft,
} from './adminProductOptions'
import type { AdminProductVariant } from '../types/adminProductDetail'

describe('adminProductOptions', () => {
  it('preserves empty named option groups while editing', () => {
    const groups = [
      { id: 'g1', name: '색상', valuesInput: '네이비, 화이트' },
      { id: 'g2', name: '사이즈', valuesInput: '' },
    ]
    expect(normalizeOptionGroupsInput(groups)).toEqual(groups)
  })

  it('parses comma and newline separated option values', () => {
    expect(parseOptionValuesInput('블랙, 화이트\n베이지')).toEqual(['블랙', '화이트', '베이지'])
  })

  it('generates cartesian combinations for generic dimension payloads', () => {
    expect(
      cartesianCombinations([
        { name: '색상', values: ['블랙', '화이트'] },
        { name: '사이즈', values: ['95', '100'] },
      ]),
    ).toEqual([
      { 색상: '블랙', 사이즈: '95' },
      { 색상: '블랙', 사이즈: '100' },
      { 색상: '화이트', 사이즈: '95' },
      { 색상: '화이트', 사이즈: '100' },
    ])
  })

  it('builds one variant per size within each color row (no row×row product)', () => {
    const groups = [
      { id: 'g1', name: '베이지', valuesInput: '95,100,105,110' },
      { id: 'g2', name: '브라운', valuesInput: '95,100,105,110' },
    ]

    expect(buildRowBasedColorSizeCombinations(groups)).toEqual([
      { 색상: '베이지', 사이즈: '95' },
      { 색상: '베이지', 사이즈: '100' },
      { 색상: '베이지', 사이즈: '105' },
      { 색상: '베이지', 사이즈: '110' },
      { 색상: '브라운', 사이즈: '95' },
      { 색상: '브라운', 사이즈: '100' },
      { 색상: '브라운', 사이즈: '105' },
      { 색상: '브라운', 사이즈: '110' },
    ])

    const variants = buildVariantsFromOptionGroups(groups, [])
    expect(variants).toHaveLength(8)
    expect(variants.map((variant) => variant.options)).toEqual([
      { 색상: '베이지', 사이즈: '95' },
      { 색상: '베이지', 사이즈: '100' },
      { 색상: '베이지', 사이즈: '105' },
      { 색상: '베이지', 사이즈: '110' },
      { 색상: '브라운', 사이즈: '95' },
      { 색상: '브라운', 사이즈: '100' },
      { 색상: '브라운', 사이즈: '105' },
      { 색상: '브라운', 사이즈: '110' },
    ])
    expect(variants.map((variant) => formatVariantOptionLabel(variant, []))).toEqual([
      '베이지 / 95',
      '베이지 / 100',
      '베이지 / 105',
      '베이지 / 110',
      '브라운 / 95',
      '브라운 / 100',
      '브라운 / 105',
      '브라운 / 110',
    ])
    expect(
      variants.some((variant) => formatVariantOptionLabel(variant, []).match(/^\d+ \/ \d+$/)),
    ).toBe(false)
  })

  it('preserves stock by 색상+사이즈 key when regenerating combinations', () => {
    const existing: AdminProductVariant[] = [
      {
        id: 'v1',
        options: { 색상: '베이지', 사이즈: '95' },
        stock: 7,
        extraPrice: 0,
        sku: 'A',
        color: '베이지',
        size: '95',
      },
    ]

    const merged = buildVariantsFromOptionGroups(
      [
        { id: 'g1', name: '베이지', valuesInput: '95, 100' },
        { id: 'g2', name: '브라운', valuesInput: '95' },
      ],
      existing,
    )

    const preserved = merged.find(
      (variant) =>
        getVariantOptionKey(variant.options) === getVariantOptionKey({ 색상: '베이지', 사이즈: '95' }),
    )

    expect(preserved?.stock).toBe(7)
    expect(preserved?.sku).toBe('A')
    expect(merged).toHaveLength(3)
    expect(getVariantTotalStock(merged)).toBe(7)
  })

  it('parses slash separated tokens in option names', () => {
    expect(parseOptionTokens('네이비/화이트')).toEqual(['네이비', '화이트'])
  })

  it('normalizes misplaced colors in option name with sizes in values', () => {
    const normalized = normalizeOptionGroupsInput([
      { id: 'g1', name: '네이비/화이트', valuesInput: '95, 100, 105' },
    ])

    expect(normalized).toEqual([
      { id: 'g1', name: '색상', valuesInput: '네이비, 화이트' },
      expect.objectContaining({ name: '사이즈', valuesInput: '95, 100, 105' }),
    ])
  })

  it('clones variants with new ids for product copy', () => {
    const cloned = cloneVariantsForNewProduct([
      {
        id: 'v1',
        options: { 색상: '블랙' },
        stock: 2,
        extraPrice: 0,
        sku: '',
        color: '블랙',
        size: '',
      },
    ])

    expect(cloned).toHaveLength(1)
    expect(cloned[0]?.id).not.toBe('v1')
    expect(cloned[0]?.stock).toBe(2)
  })

  it('sums variant draft stocks for total stock display', () => {
    const variants: AdminProductVariant[] = [
      {
        id: 'v95',
        options: { 색상: '블랙', 사이즈: '95' },
        stock: 3,
        extraPrice: 0,
        sku: '',
        color: '블랙',
        size: '95',
      },
      {
        id: 'v100',
        options: { 색상: '블랙', 사이즈: '100' },
        stock: 5,
        extraPrice: 0,
        sku: '',
        color: '블랙',
        size: '100',
      },
      {
        id: 'v105',
        options: { 색상: '블랙', 사이즈: '105' },
        stock: 2,
        extraPrice: 0,
        sku: '',
        color: '블랙',
        size: '105',
      },
    ]

    const initialDraft = {
      v95: '3',
      v100: '5',
      v105: '2',
    }

    expect(getDisplayedVariantTotalStock(variants, initialDraft)).toBe(10)

    const afterEditDraft = { ...initialDraft, v95: '4' }
    expect(getDisplayedVariantTotalStock(variants, afterEditDraft)).toBe(11)

    const afterBulkDraft = {
      v95: '32',
      v100: '32',
      v105: '32',
    }
    expect(getDisplayedVariantTotalStock(variants, afterBulkDraft)).toBe(96)
    expect(resolveVariantStocksFromDraft(variants, afterBulkDraft).every((row) => row.stock === 32)).toBe(
      true,
    )
  })

  it('mergeVariantCombinations still preserves stock for matching keys', () => {
    const existing: AdminProductVariant[] = [
      {
        id: 'v1',
        options: { 색상: '블랙', 사이즈: '95' },
        stock: 7,
        extraPrice: 0,
        sku: 'A',
        color: '블랙',
        size: '95',
      },
    ]

    const merged = mergeVariantCombinations(
      existing,
      [
        { 색상: '블랙', 사이즈: '95' },
        { 색상: '블랙', 사이즈: '100' },
      ],
      ['색상', '사이즈'],
    )

    expect(merged.find((row) => row.options.사이즈 === '95')?.stock).toBe(7)
    expect(merged).toHaveLength(2)
  })
})
