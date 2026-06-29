import { sanitizeSearchQuery } from '../../utils/sanitize'

/** Trim surrounding whitespace and strip unsafe characters for display and URL params. */
export function normalizeKeyword(query: string): string {
  return sanitizeSearchQuery(query)
}

/** Lowercase and remove all whitespace for fuzzy comparison. */
export function normalizeKeywordForMatch(query: string): string {
  return normalizeKeyword(query).toLowerCase().replace(/\s+/g, '')
}

/** Normalize searchable text the same way as the query. */
export function normalizeTextForMatch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '')
}

export function keywordsMatch(query: string, target: string): boolean {
  const normalizedQuery = normalizeKeywordForMatch(query)
  if (!normalizedQuery) {
    return true
  }

  return normalizeTextForMatch(target).includes(normalizedQuery)
}
