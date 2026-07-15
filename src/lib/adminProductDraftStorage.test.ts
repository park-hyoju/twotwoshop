import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAllProductDraftsForAdmin,
  clearProductDraft,
  formatDraftSavedAtLabel,
  isDraftOlderThanDatabase,
  loadProductDraft,
  normalizeProductDetailForm,
  parseProductEditorDraft,
  saveProductDraft,
} from './adminProductDraftStorage'

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
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size
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

  it('round-trips draft with related products and options stock', () => {
    const form = normalizeProductDetailForm('p2', {
      id: 'p2',
      name: '드래프트',
      stock: 8,
      optionGroups: [{ id: 'g1', name: '색상', valuesInput: '블랙' }],
      variants: [{ id: 'v1', options: { 색상: '블랙' }, stock: 8, extraPrice: 0, sku: '', color: '블랙', size: '' }],
      description: '상세설명',
      images: ['https://example.com/a.jpg'],
      thumbnail: 'https://example.com/a.jpg',
    })

    saveProductDraft({
      adminUserId: 'admin-1',
      productId: 'p2',
      mode: 'edit',
      form,
      relatedProducts: [{ id: 'r1', name: '연관', slug: 'related', price: 1000, thumbnail: '' }],
      variantStockDraft: { v1: '8' },
    })

    const loaded = loadProductDraft('admin-1', 'p2', 'edit')

    expect(loaded?.form.name).toBe('드래프트')
    expect(loaded?.form.stock).toBe(8)
    expect(loaded?.form.variants[0]?.stock).toBe(8)
    expect(loaded?.form.description).toBe('상세설명')
    expect(loaded?.relatedProducts).toHaveLength(1)
    expect(loaded?.relatedProducts[0]?.id).toBe('r1')
    expect(loaded?.variantStockDraft?.v1).toBe('8')
  })

  it('isolates drafts by admin user and product id', () => {
    const formA = normalizeProductDetailForm('prod-a', { id: 'prod-a', name: 'A' })
    const formB = normalizeProductDetailForm('prod-b', { id: 'prod-b', name: 'B' })

    saveProductDraft({
      adminUserId: 'admin-1',
      productId: 'prod-a',
      mode: 'edit',
      form: formA,
    })
    saveProductDraft({
      adminUserId: 'admin-2',
      productId: 'prod-a',
      mode: 'edit',
      form: { ...formA, name: 'A-other-admin' },
    })
    saveProductDraft({
      adminUserId: 'admin-1',
      productId: 'prod-b',
      mode: 'edit',
      form: formB,
    })

    expect(loadProductDraft('admin-1', 'prod-a')?.form.name).toBe('A')
    expect(loadProductDraft('admin-2', 'prod-a')?.form.name).toBe('A-other-admin')
    expect(loadProductDraft('admin-1', 'prod-b')?.form.name).toBe('B')
    expect(loadProductDraft('admin-1', 'prod-a')?.form.name).not.toBe('B')
  })

  it('stores create drafts under :new alias without mixing into edit keys', () => {
    const form = normalizeProductDetailForm('new-1', { id: 'new-1', name: '신규' })
    saveProductDraft({
      adminUserId: 'admin-1',
      productId: 'new-1',
      mode: 'create',
      form,
    })

    expect(loadProductDraft('admin-1', 'new-1', 'create')?.form.name).toBe('신규')
    expect(localStorage.getItem('admin_product_draft:admin-1:new')).toContain('신규')
  })

  it('clears draft after successful-save simulation', () => {
    const form = normalizeProductDetailForm('p3', { id: 'p3', name: '삭제대상' })
    saveProductDraft({
      adminUserId: 'admin-1',
      productId: 'p3',
      mode: 'edit',
      form,
    })

    clearProductDraft('admin-1', 'p3', 'edit')
    expect(loadProductDraft('admin-1', 'p3')).toBeNull()
  })

  it('discards broken draft payloads safely', () => {
    localStorage.setItem('admin_product_draft:admin-1:broken', '{not-json')
    expect(parseProductEditorDraft('broken', 'admin-1', '{not-json')).toBeNull()
    expect(loadProductDraft('admin-1', 'broken')).toBeNull()
  })

  it('detects stale drafts against newer DB timestamps', () => {
    expect(
      isDraftOlderThanDatabase('2026-07-15T01:00:00.000Z', '2026-07-15T02:00:00.000Z'),
    ).toBe(true)
    expect(
      isDraftOlderThanDatabase('2026-07-15T03:00:00.000Z', '2026-07-15T02:00:00.000Z'),
    ).toBe(false)
  })

  it('formats draft saved label for same-day times', () => {
    const label = formatDraftSavedAtLabel('2026-07-15T12:42:00.000Z', new Date('2026-07-15T20:00:00.000Z'))
    expect(label).toContain('임시저장 완료')
  })

  it('clears all drafts for one admin on logout', () => {
    saveProductDraft({
      adminUserId: 'admin-1',
      productId: 'p1',
      mode: 'edit',
      form: normalizeProductDetailForm('p1', { id: 'p1', name: 'keep-check' }),
    })
    saveProductDraft({
      adminUserId: 'admin-2',
      productId: 'p1',
      mode: 'edit',
      form: normalizeProductDetailForm('p1', { id: 'p1', name: 'other' }),
    })

    clearAllProductDraftsForAdmin('admin-1')
    expect(loadProductDraft('admin-1', 'p1')).toBeNull()
    expect(loadProductDraft('admin-2', 'p1')?.form.name).toBe('other')
  })
})
