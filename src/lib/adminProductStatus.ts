import type { DisplayCategory } from '../types/displayCategory'
import type { ProductStatus } from '../types/status'

export const PRODUCT_STATUS_OPTIONS: Array<{ value: ProductStatus; label: string }> = [
  { value: 'active', label: '활성' },
  { value: 'soldout', label: '품절' },
  { value: 'hidden', label: '비활성' },
]

export const PRODUCT_STATUS_FILTER_OPTIONS: Array<{
  value: 'all' | ProductStatus
  label: string
}> = [{ value: 'all', label: '전체' }, ...PRODUCT_STATUS_OPTIONS]

export const DISPLAY_CATEGORY_OPTIONS: Array<{ value: DisplayCategory; label: string }> = [
  { value: 'top', label: '상의' },
  { value: 'bottom', label: '하의' },
  { value: 'dress', label: '원피스' },
  { value: 'shoes', label: '신발' },
  { value: 'misc', label: '기타' },
]

const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: '활성',
  soldout: '품절',
  hidden: '비활성',
}

const PRODUCT_STATUS_BADGE_CLASSES: Record<ProductStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  soldout: 'bg-amber-50 text-amber-800 ring-amber-200',
  hidden: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
}

const DISPLAY_CATEGORY_LABELS: Record<DisplayCategory, string> = {
  top: '상의',
  bottom: '하의',
  dress: '원피스',
  shoes: '신발',
  misc: '기타',
}

export function getProductStatusLabel(status: ProductStatus): string {
  return PRODUCT_STATUS_LABELS[status]
}

export function getProductStatusBadgeClassName(status: ProductStatus): string {
  return PRODUCT_STATUS_BADGE_CLASSES[status]
}

export function getDisplayCategoryLabel(category: string | null): string {
  if (!category) {
    return '-'
  }

  return DISPLAY_CATEGORY_LABELS[category as DisplayCategory] ?? category
}

export function isDisplayCategory(value: string): value is DisplayCategory {
  return DISPLAY_CATEGORY_OPTIONS.some((option) => option.value === value)
}
