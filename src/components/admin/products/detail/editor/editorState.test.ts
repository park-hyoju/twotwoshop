import { describe, expect, it } from 'vitest'
import { createEmptyProductDetailForm } from '../../../../../lib/adminProductDetailDefaults'
import { isDescriptionOnlySave, serializeEditorState } from './editorState'

describe('isDescriptionOnlySave', () => {
  const baseForm = {
    ...createEmptyProductDetailForm('p1'),
    name: '테스트 상품',
    status: 'active' as const,
    stock: 12,
    variants: [
      {
        id: 'v1',
        options: { 색상: '블랙' },
        stock: 12,
        extraPrice: 0,
        sku: 'SKU-1',
        color: '블랙',
        size: '',
      },
    ],
    description: '기존 설명',
  }

  it('returns true when only description changed', () => {
    const snapshot = serializeEditorState(baseForm, [])
    const nextForm = { ...baseForm, description: '수정된 설명' }

    expect(isDescriptionOnlySave(nextForm, snapshot, [])).toBe(true)
  })

  it('returns false when variant stock changed', () => {
    const snapshot = serializeEditorState(baseForm, [])
    const nextForm = {
      ...baseForm,
      variants: [{ ...baseForm.variants[0], stock: 3 }],
      stock: 3,
    }

    expect(isDescriptionOnlySave(nextForm, snapshot, [])).toBe(false)
  })

  it('returns false when status changed', () => {
    const snapshot = serializeEditorState(baseForm, [])
    const nextForm = { ...baseForm, status: 'soldout' as const }

    expect(isDescriptionOnlySave(nextForm, snapshot, [])).toBe(false)
  })

  it('returns false when price changed', () => {
    const snapshot = serializeEditorState(baseForm, [])
    const nextForm = { ...baseForm, price: 10_000 }

    expect(isDescriptionOnlySave(nextForm, snapshot, [])).toBe(false)
  })
})
