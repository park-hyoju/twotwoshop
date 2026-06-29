import { normalizeKeyword } from './normalizeKeyword'

const STORAGE_KEY = 'twotwoshop.recentSearches'
const MAX_RECENT_SEARCHES = 10

function readRecentSearches(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

function writeRecentSearches(searches: string[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
}

export function getRecentSearches(): string[] {
  return readRecentSearches()
}

export function addRecentSearch(query: string): string[] {
  const normalized = normalizeKeyword(query)
  if (!normalized) {
    return readRecentSearches()
  }

  const nextSearches = [
    normalized,
    ...readRecentSearches().filter((item) => item !== normalized),
  ].slice(0, MAX_RECENT_SEARCHES)

  writeRecentSearches(nextSearches)
  return nextSearches
}

export function removeRecentSearch(query: string): string[] {
  const normalized = normalizeKeyword(query)
  const nextSearches = readRecentSearches().filter((item) => item !== normalized)
  writeRecentSearches(nextSearches)
  return nextSearches
}

export function clearRecentSearches(): string[] {
  writeRecentSearches([])
  return []
}
