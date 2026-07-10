import { describe, expect, it } from 'vitest'
import {
  buildVariantsFromOptionGroups,
  cartesianCombinations,
  cloneVariantsForNewProduct,
  formatVariantOptionLabel,
  getDisplayedVariantTotalStock,
  getVariantOptionKey,
  getVariantTotalStock,
  mergeVariantCombinations,
  normalizeOptionGroupsInput,
  optionGroupsNeedNormalization,
  parseOptionTokens,
  parseOptionValuesInput,
  resolveVariantStocksFromDraft,
} from './adminProductOptions'
import type { AdminProductVariant } from '../types/adminProductDetail'

describe('adminProductOptions', () => {
  it('preserves in-progress option groups with empty values', () => {
    const normalized = normalizeOptionGroupsInput([
      { id: 'g1', name: '색상', valuesInput: '' },
    ])

    expect(normalized).toEqual([{ id: 'g1', name: '색상', valuesInput: '' }])
    expect(optionGroupsNeedNormalization(normalized)).toBe(false)
  })

  it('keeps color and empty size groups together while editing', () => {
    const groups = [
      { id: 'g1', name: '색상', valuesInput: '네이비, 화이트, 블랙' },
      { id: 'g2', name: '사이즈', valuesInput: '' },
    ]

    expect(optionGroupsNeedNormalization(groups)).toBe(false)
    expect(normalizeOptionGroupsInput(groups)).toEqual(groups)

    const withSizes = [
      { id: 'g1', name: '색상', valuesInput: '네이비, 화이트' },
      { id: 'g2', name: '사이즈', valuesInput: '95, 100, 105' },
    ]
    const variants = buildVariantsFromOptionGroups(withSizes, [])
    expect(variants).toHaveLength(6)
    expect(variants.map((variant) => formatVariantOptionLabel(variant, ['색상', '사이즈']))).toEqual([
      '네이비 / 95',
      '네이비 / 100',
      '네이비 / 105',
      '화이트 / 95',
      '화이트 / 100',
      '화이트 / 105',
    ])
  })

  it('parses comma and newline separated option values', () => {
    expect(parseOptionValuesInput('블랙, 화이트\n베이지')).toEqual(['블랙', '화이트', '베이지'])
  })

  it('generates cartesian combinations', () => {
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

  it('preserves stock when regenerating combinations', () => {
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

    const combinations = cartesianCombinations([
      { name: '색상', values: ['블랙', '화이트'] },
      { name: '사이즈', values: ['95', '100'] },
    ])

    const merged = mergeVariantCombinations(existing, combinations, ['색상', '사이즈'])
    const preserved = merged.find(
      (variant) => getVariantOptionKey(variant.options) === getVariantOptionKey({ 색상: '블랙', 사이즈: '95' }),
    )

    expect(preserved?.stock).toBe(7)
    expect(preserved?.sku).toBe('A')
    expect(merged).toHaveLength(4)
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

    const variants = buildVariantsFromOptionGroups(
      [{ id: 'g1', name: '네이비/화이트', valuesInput: '95, 100, 105' }],
      [],
    )

    expect(variants.map((variant) => formatVariantOptionLabel(variant, ['색상', '사이즈']))).toEqual([
      '네이비 / 95',
      '네이비 / 100',
      '네이비 / 105',
      '화이트 / 95',
      '화이트 / 100',
      '화이트 / 105',
    ])
  })

  it('merges duplicate size rows after color-name correction', () => {
    const variants = buildVariantsFromOptionGroups(
      [
        { id: 'g1', name: '네이비/화이트', valuesInput: '95, 100, 105' },
        { id: 'g2', name: '사이즈', valuesInput: '95, 100, 105' },
      ],
      [],
    )

    expect(variants).toHaveLength(6)
    expect(variants.map((variant) => formatVariantOptionLabel(variant, ['색상', '사이즈']))).toContain(
      '네이비 / 95',
    )
    expect(variants.map((variant) => formatVariantOptionLabel(variant, ['색상', '사이즈']))).not.toContain(
      '95 / 95',
    )
  })

  it('builds variants automatically from option group inputs', () => {
    const merged = buildVariantsFromOptionGroups(
      [
        { id: 'g1', name: '색상', valuesInput: '블랙, 화이트' },
        { id: 'g2', name: '사이즈', valuesInput: '95, 100, 105' },
      ],
      [],
    )

    expect(merged).toHaveLength(6)
    expect(merged.map((variant) => formatVariantOptionLabel(variant, ['색상', '사이즈']))).toEqual([
      '블랙 / 95',
      '블랙 / 100',
      '블랙 / 105',
      '화이트 / 95',
      '화이트 / 100',
      '화이트 / 105',
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
})
