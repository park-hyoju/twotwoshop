import { sanitizeSlug } from '../utils/sanitize'
import { supabase } from './supabase'

const HANGUL_BASE = 0xac00

const CHO_ROMAN = [
  'g',
  'kk',
  'n',
  'd',
  'tt',
  'r',
  'm',
  'b',
  'pp',
  's',
  'ss',
  '',
  'j',
  'jj',
  'ch',
  'k',
  't',
  'p',
  'h',
] as const

const JUNG_ROMAN = [
  'a',
  'ae',
  'ya',
  'yae',
  'eo',
  'e',
  'yeo',
  'ye',
  'o',
  'wa',
  'wae',
  'oe',
  'yo',
  'u',
  'wo',
  'we',
  'wi',
  'yu',
  'eu',
  'ui',
  'i',
] as const

const JONG_ROMAN = [
  '',
  'g',
  'kk',
  'gs',
  'n',
  'nj',
  'nh',
  'd',
  'l',
  'lg',
  'lm',
  'lb',
  'ls',
  'lt',
  'lp',
  'lh',
  'm',
  'b',
  'bs',
  's',
  'ss',
  'ng',
  'j',
  'ch',
  'k',
  't',
  'p',
  'h',
] as const

function romanizeHangulChar(char: string): string {
  const code = char.charCodeAt(0)

  if (code < HANGUL_BASE || code > HANGUL_BASE + 11172) {
    return char
  }

  const syllableIndex = code - HANGUL_BASE
  const cho = Math.floor(syllableIndex / 588)
  const jung = Math.floor((syllableIndex % 588) / 28)
  const jong = syllableIndex % 28

  return `${CHO_ROMAN[cho] ?? ''}${JUNG_ROMAN[jung] ?? ''}${JONG_ROMAN[jong] ?? ''}`
}

/** 상품명에서 URL-safe slug 생성 (한글 → 로마자 변환 포함). */
export function generateProductSlugFromName(name: string): string {
  const trimmed = name.trim()

  if (!trimmed) {
    return ''
  }

  const romanized = Array.from(trimmed)
    .map((char) => {
      const code = char.charCodeAt(0)
      if (code >= HANGUL_BASE && code <= HANGUL_BASE + 11172) {
        return romanizeHangulChar(char)
      }
      return char
    })
    .join('')

  const slug = sanitizeSlug(romanized)

  if (slug.length >= 2) {
    return slug.slice(0, 100)
  }

  return `product-${Date.now().toString(36)}`
}

async function isProductSlugTaken(slug: string, excludeProductId?: string): Promise<boolean> {
  if (!supabase) {
    return false
  }

  let query = supabase.from('products').select('id', { count: 'exact', head: true }).eq('slug', slug)

  if (excludeProductId) {
    query = query.neq('id', excludeProductId)
  }

  const { count, error } = await query

  if (error) {
    console.warn('[productSlug] slug lookup failed', error)
    return false
  }

  return (count ?? 0) > 0
}

/** 중복 시 -2, -3 … 접미사를 붙여 고유 slug 반환. */
export async function resolveUniqueProductSlug(
  baseSlug: string,
  excludeProductId?: string,
): Promise<string> {
  const normalized = sanitizeSlug(baseSlug) || `product-${Date.now().toString(36)}`
  let candidate = normalized
  let suffix = 2

  while (await isProductSlugTaken(candidate, excludeProductId)) {
    candidate = `${normalized}-${suffix}`
    suffix += 1
  }

  return candidate
}
