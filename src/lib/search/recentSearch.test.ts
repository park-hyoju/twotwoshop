import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from './recentSearch'

class LocalStorageMock {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

describe('recentSearch', () => {
  beforeEach(() => {
    const localStorage = new LocalStorageMock()
    vi.stubGlobal('window', { localStorage })
    clearRecentSearches()
  })

  it('stores recent searches with newest first', () => {
    addRecentSearch('원피스')
    addRecentSearch('향수')

    expect(getRecentSearches()).toEqual(['향수', '원피스'])
  })

  it('deduplicates and limits to 10 items', () => {
    const keywords = Array.from({ length: 12 }, (_, index) => `상품${index + 1}`)
    keywords.forEach((keyword) => addRecentSearch(keyword))

    expect(getRecentSearches()).toHaveLength(10)
    expect(getRecentSearches()[0]).toBe('상품12')
  })

  it('removes a single recent search', () => {
    addRecentSearch('원피스')
    addRecentSearch('향수')

    removeRecentSearch('원피스')

    expect(getRecentSearches()).toEqual(['향수'])
  })
})
