import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadProductDraft, normalizeProductDetailForm, saveProductDraft } from './adminProductDraftStorage'

describe('adminProductDraftStorage', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
    })
  })
  it('normalizes legacy drafts without option groups', () => {
    const form = normalizeProductDetailForm('p1', {
      id: 'p1',
      name: '테스트',
      variants: [{ id: 'v1', color: '블랙', size: 'M', stock: 3 }],
    } as never)

    expect(form.optionGroups).toEqual([])
    expect(form.variants[0]?.options).toEqual({})
    expect(form.variants[0]?.stock).toBe(3)
  })

  it('round-trips draft with related products', () => {
    const form = normalizeProductDetailForm('p2', {
      id: 'p2',
      name: '드래프트',
      optionGroups: [{ id: 'g1', name: '색상', valuesInput: '블랙' }],
      variants: [],
    })

    saveProductDraft('p2', form, [{ id: 'r1', name: '연관', slug: 'related', price: 1000, thumbnail: '' }])
    const loaded = loadProductDraft('p2')

    expect(loaded?.form.name).toBe('드래프트')
    expect(loaded?.relatedProducts).toHaveLength(1)
    expect(loaded?.relatedProducts[0]?.id).toBe('r1')
  })
})
