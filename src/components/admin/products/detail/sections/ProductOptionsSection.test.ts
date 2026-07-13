import { describe, expect, it } from 'vitest'
import { createEmptyProductDetailForm } from '../../../../../lib/adminProductDetailDefaults'
import { getDisplayedVariantTotalStock } from '../../../../../lib/adminProductOptions'
import { resolveVariantStockFromDraft } from '../../../../../lib/adminProductOptions'
import { isDescriptionOnlyChanges, detectAdminProductDetailChanges } from '../editor/productSaveChanges'
import { serializeEditorState } from '../editor/editorState'
import { applyVariantStockDraftToForm } from '../editor/productSaveChanges'

describe('applyVariantStockDraftToForm', () => {
  const variants = [
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

  it('applies stock draft by option key after variant id regeneration', () => {
    const form = {
      ...createEmptyProductDetailForm('p1'),
      optionGroups: [
        { id: 'g1', name: '베이지', valuesInput: '95, 100' },
        { id: 'g2', name: '브라운', valuesInput: '95, 100' },
      ],
      variants: [
        {
          id: 'old-1',
          options: { 색상: '베이지', 사이즈: '95' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '베이지',
          size: '95',
        },
        {
          id: 'old-2',
          options: { 색상: '베이지', 사이즈: '100' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '베이지',
          size: '100',
        },
        {
          id: 'old-3',
          options: { 색상: '브라운', 사이즈: '95' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '브라운',
          size: '95',
        },
        {
          id: 'old-4',
          options: { 색상: '브라운', 사이즈: '100' },
          stock: 0,
          extraPrice: 0,
          sku: '',
          color: '브라운',
          size: '100',
        },
      ],
      stock: 0,
    }

    const draft = {
      'old-1': '3',
      'old-2': '4',
      'old-3': '5',
      'old-4': '6',
    }

    const result = applyVariantStockDraftToForm(form, draft)

    expect(result.variants.map((row) => row.stock)).toEqual([3, 4, 5, 6])
    expect(result.stock).toBe(18)
  })

  it('preserves variant stock when draft has no entry for that row', () => {
    const form = {
      ...createEmptyProductDetailForm('p1'),
      stock: 10,
      variants,
    }

    const result = applyVariantStockDraftToForm(form, {})

    expect(result.variants.map((row) => row.stock)).toEqual([3, 5, 2])
    expect(result.stock).toBe(10)
  })

  it('stores summed stock on save when option stocks are edited', () => {
    const form = {
      ...createEmptyProductDetailForm('p1'),
      stock: 10,
      variants,
    }

    const draft = { v95: '4', v100: '5', v105: '2' }
    const result = applyVariantStockDraftToForm(form, draft)

    expect(getDisplayedVariantTotalStock(result.variants, draft)).toBe(11)
    expect(result.stock).toBe(11)
  })

  it('applies bulk stock to every variant on save', () => {
    const form = {
      ...createEmptyProductDetailForm('p1'),
      stock: 10,
      variants,
    }

    const draft = { v95: '32', v100: '32', v105: '32' }
    const result = applyVariantStockDraftToForm(form, draft)

    expect(result.variants.every((row) => row.stock === 32)).toBe(true)
    expect(result.stock).toBe(96)
  })

  it('keeps stock when draft key is missing', () => {
    const row = variants[0]
    expect(resolveVariantStockFromDraft(row, { v95: '3' })).toBe(3)
    expect(resolveVariantStockFromDraft(row, {})).toBe(3)
  })
})

describe('description-only save with option stock', () => {
  it('does not treat unchanged option stock as non-description change', () => {
    const form = {
      ...createEmptyProductDetailForm('p1'),
      stock: 3,
      status: 'active' as const,
      variants: [
        {
          id: 'v95',
          options: { 색상: '블랙', 사이즈: '95' },
          stock: 3,
          extraPrice: 0,
          sku: '',
          color: '블랙',
          size: '95',
        },
      ],
      description: '기존 설명',
    }

    const snapshot = serializeEditorState(form, [])
    const saved = JSON.parse(snapshot).form as typeof form
    const nextForm = { ...form, description: '수정된 설명' }
    const changes = detectAdminProductDetailChanges(saved, nextForm, [], [])

    expect(isDescriptionOnlyChanges(changes)).toBe(true)
    expect(applyVariantStockDraftToForm(nextForm, {}).variants[0]?.stock).toBe(3)
  })
})
