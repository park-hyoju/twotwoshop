import type { Product } from '../types/product'
import type { RecentProductEntry } from '../types/mypage'

const STORAGE_KEY = 'twotwoshop:recent-products'
const MAX_ITEMS = 20

let memoryEntries: RecentProductEntry[] = []

function readEntries(): RecentProductEntry[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return []
      }

      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed.filter(
        (item): item is RecentProductEntry =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as RecentProductEntry).slug === 'string' &&
          typeof (item as RecentProductEntry).name === 'string' &&
          typeof (item as RecentProductEntry).thumbnail === 'string' &&
          typeof (item as RecentProductEntry).price === 'number' &&
          typeof (item as RecentProductEntry).viewedAt === 'string',
      )
    } catch {
      return []
    }
  }

  return [...memoryEntries]
}

function writeEntries(entries: RecentProductEntry[]): void {
  const nextEntries = entries.slice(0, MAX_ITEMS)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries))
    return
  }

  memoryEntries = nextEntries
}

export function getRecentProducts(): RecentProductEntry[] {
  return readEntries().sort(
    (left, right) => new Date(right.viewedAt).getTime() - new Date(left.viewedAt).getTime(),
  )
}

export function addRecentProduct(product: Pick<Product, 'slug' | 'name' | 'thumbnail' | 'price'>): void {
  const nextEntry: RecentProductEntry = {
    slug: product.slug,
    name: product.name,
    thumbnail: product.thumbnail,
    price: product.price,
    viewedAt: new Date().toISOString(),
  }

  const withoutDuplicate = readEntries().filter((entry) => entry.slug !== product.slug)
  writeEntries([nextEntry, ...withoutDuplicate])
}

export function removeRecentProduct(slug: string): void {
  writeEntries(readEntries().filter((entry) => entry.slug !== slug))
}

export function clearRecentProducts(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  memoryEntries = []
}
