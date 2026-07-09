import type { DetailMediaItem, DetailMediaType } from '../types/detailMedia'
import { getDetailImageUrls } from './productIntroContent'
import { isDetailVideoUrl } from './productDetailMedia'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isMediaType(value: unknown): value is DetailMediaType {
  return value === 'image' || value === 'video'
}

function extractFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url, 'https://placeholder.local').pathname
    const segment = pathname.split('/').pop() ?? 'media'
    return decodeURIComponent(segment)
  } catch {
    const segment = url.split('/').pop() ?? 'media'
    return segment.split('?')[0] ?? 'media'
  }
}

function parseDetailMediaItem(value: unknown, fallbackOrder: number): DetailMediaItem | null {
  if (!isRecord(value)) {
    return null
  }

  const url = asString(value.url).trim()
  if (!url) {
    return null
  }

  const type = isMediaType(value.type) ? value.type : isDetailVideoUrl(url) ? 'video' : 'image'

  return {
    type,
    url,
    order: typeof value.order === 'number' && Number.isFinite(value.order) ? value.order : fallbackOrder,
    filename: asString(value.filename) || extractFilenameFromUrl(url),
    thumbnail: asString(value.thumbnail) || null,
    duration: asNumberOrNull(value.duration),
    width: asNumberOrNull(value.width),
    height: asNumberOrNull(value.height),
  }
}

export function parseDetailMediaArray(value: unknown): DetailMediaItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index) => parseDetailMediaItem(item, index))
    .filter((item): item is DetailMediaItem => item !== null)
}

export function reindexDetailMediaByArrayOrder(items: DetailMediaItem[]): DetailMediaItem[] {
  return items.map((item, index) => ({ ...item, order: index }))
}

/** Sorts by stored `order` field, then reindexes 0..n-1 (DB read / legacy). */
export function normalizeDetailMediaOrder(items: DetailMediaItem[]): DetailMediaItem[] {
  return reindexDetailMediaByArrayOrder(
    [...items].sort((left, right) => left.order - right.order),
  )
}

export function migrateDetailMedia(
  detailMedia: unknown,
  shortDescription: string,
  images: string[],
): DetailMediaItem[] {
  const parsed = parseDetailMediaArray(detailMedia)
  if (parsed.length > 0) {
    return normalizeDetailMediaOrder(parsed)
  }

  const legacyUrls = getDetailImageUrls(shortDescription, images)

  return legacyUrls.map((url, index) => ({
    type: isDetailVideoUrl(url) ? 'video' : 'image',
    url,
    order: index,
    filename: extractFilenameFromUrl(url),
    thumbnail: null,
    duration: null,
    width: null,
    height: null,
  }))
}

export function resolveProductDetailMedia(
  detailMedia: unknown,
  shortDescription: string,
  images: string[],
): DetailMediaItem[] {
  return migrateDetailMedia(detailMedia, shortDescription, images)
}

export function serializeDetailMediaForDb(items: DetailMediaItem[]): DetailMediaItem[] {
  return normalizeDetailMediaOrder(items).map((item) => ({
    type: item.type,
    url: item.url,
    order: item.order,
    filename: item.filename,
    thumbnail: item.thumbnail ?? null,
    duration: item.duration ?? null,
    width: item.width ?? null,
    height: item.height ?? null,
  }))
}
