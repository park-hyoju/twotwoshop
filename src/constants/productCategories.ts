import { ROUTES } from '../lib/routes'
import type { NavItem } from '../types/navigation'

export type ProductCategoryGroup = 'women' | 'men' | 'common'

export type ProductCategoryId =
  | 'women_top'
  | 'women_bottom'
  | 'women_dress'
  | 'women_outer'
  | 'women_skirt'
  | 'women_set'
  | 'men_top'
  | 'men_bottom'
  | 'men_outer'
  | 'men_set'
  | 'shoes'
  | 'bag'
  | 'belt'
  | 'accessory'
  | 'perfume'
  | 'etc'

export interface ProductCategoryDefinition {
  id: ProductCategoryId
  label: string
  group: ProductCategoryGroup
  route: string
  /** 상단 네비게이션 여성/남성 하위 메뉴 노출 여부 */
  showInGenderNav?: boolean
}

export const PRODUCT_CATEGORY_IDS: ProductCategoryId[] = [
  'women_top',
  'women_bottom',
  'women_dress',
  'women_outer',
  'women_skirt',
  'women_set',
  'men_top',
  'men_bottom',
  'men_outer',
  'men_set',
  'shoes',
  'bag',
  'belt',
  'accessory',
  'perfume',
  'etc',
]

export const PRODUCT_CATEGORIES: ProductCategoryDefinition[] = [
  { id: 'women_top', label: '상의', group: 'women', route: ROUTES.womenTop, showInGenderNav: true },
  { id: 'women_bottom', label: '하의', group: 'women', route: ROUTES.womenBottom, showInGenderNav: true },
  { id: 'women_dress', label: '원피스', group: 'women', route: ROUTES.womenDress, showInGenderNav: true },
  { id: 'women_outer', label: '아우터', group: 'women', route: ROUTES.womenOuter, showInGenderNav: true },
  { id: 'women_skirt', label: '스커트', group: 'women', route: ROUTES.womenSkirt, showInGenderNav: true },
  { id: 'women_set', label: '세트상품', group: 'women', route: ROUTES.womenSet, showInGenderNav: true },
  { id: 'men_top', label: '상의', group: 'men', route: ROUTES.menTop, showInGenderNav: true },
  { id: 'men_bottom', label: '하의', group: 'men', route: ROUTES.menBottom, showInGenderNav: true },
  { id: 'men_outer', label: '아우터', group: 'men', route: ROUTES.menOuter, showInGenderNav: true },
  { id: 'men_set', label: '세트상품', group: 'men', route: ROUTES.menSet, showInGenderNav: true },
  { id: 'shoes', label: '신발', group: 'common', route: ROUTES.productsShoes },
  { id: 'bag', label: '가방', group: 'common', route: ROUTES.productsBag },
  { id: 'belt', label: '벨트', group: 'common', route: ROUTES.productsBelt },
  { id: 'accessory', label: '액세서리', group: 'common', route: ROUTES.productsAccessory },
  { id: 'perfume', label: '향수', group: 'common', route: ROUTES.productsPerfume },
  { id: 'etc', label: '기타', group: 'common', route: ROUTES.productsEtc },
]

const PRODUCT_CATEGORY_BY_ID = new Map(
  PRODUCT_CATEGORIES.map((category) => [category.id, category]),
)

const ROUTE_BY_CATEGORY_ID = new Map(
  PRODUCT_CATEGORIES.map((category) => [category.id, category.route]),
)

export function isProductCategoryId(value: string): value is ProductCategoryId {
  return PRODUCT_CATEGORY_IDS.includes(value as ProductCategoryId)
}

export function getProductCategoryDefinition(
  categoryId: ProductCategoryId,
): ProductCategoryDefinition {
  return PRODUCT_CATEGORY_BY_ID.get(categoryId)!
}

export function getProductCategoryLabel(categoryId: ProductCategoryId | string | null): string {
  if (!categoryId || !isProductCategoryId(categoryId)) {
    return '-'
  }

  return getProductCategoryDefinition(categoryId).label
}

export function getProductCategoryGroup(categoryId: ProductCategoryId): ProductCategoryGroup {
  return getProductCategoryDefinition(categoryId).group
}

export function getProductCategoryRoute(categoryId: ProductCategoryId): string {
  return ROUTE_BY_CATEGORY_ID.get(categoryId) ?? ROUTES.products
}

export function getProductCategoriesByGroup(group: ProductCategoryGroup): ProductCategoryDefinition[] {
  return PRODUCT_CATEGORIES.filter((category) => category.group === group)
}

export function getGenderNavCategories(group: 'women' | 'men'): ProductCategoryDefinition[] {
  return PRODUCT_CATEGORIES.filter(
    (category) => category.group === group && category.showInGenderNav,
  )
}

export const PRODUCT_CATEGORY_GROUP_LABELS: Record<ProductCategoryGroup, string> = {
  women: '여성',
  men: '남성',
  common: '잡화',
}

export function getAdminCategorySelectOptions(): Array<{
  group: ProductCategoryGroup
  groupLabel: string
  options: Array<{ value: ProductCategoryId; label: string }>
}> {
  return (['women', 'men', 'common'] as const).map((group) => ({
    group,
    groupLabel: PRODUCT_CATEGORY_GROUP_LABELS[group],
    options: getProductCategoriesByGroup(group).map((category) => ({
      value: category.id,
      label: category.label,
    })),
  }))
}

export function getCategoryIdsForGroup(group: ProductCategoryGroup): ProductCategoryId[] {
  return getProductCategoriesByGroup(group).map((category) => category.id)
}

export function getProductCategoryDisplayLabel(categoryId: ProductCategoryId): string {
  const group = getProductCategoryGroup(categoryId)
  const label = getProductCategoryLabel(categoryId)

  if (group === 'common') {
    return label
  }

  return `${PRODUCT_CATEGORY_GROUP_LABELS[group]} · ${label}`
}

/** 관리자·스토어프론트 공통 카테고리 ID 목록 */
export function getAllProductCategoryIds(): ProductCategoryId[] {
  return [...PRODUCT_CATEGORY_IDS]
}

export function isProductsNestedCategoryRoute(route: string): boolean {
  return route.startsWith('/products/') && route !== ROUTES.products
}

export function getProductsNestedCategoryPath(route: string): string {
  return route.replace('/products/', '')
}

export function getRootCategoryRouterPath(route: string): string {
  return route.replace(/^\//, '')
}

export const CATEGORY_GROUP_LANDINGS: Array<{
  group: ProductCategoryGroup
  route: string
  title: string
  description: string
}> = [
  {
    group: 'women',
    route: ROUTES.women,
    title: '여성 전체',
    description: '여성 의류 및 상품을 모아보세요.',
  },
  {
    group: 'men',
    route: ROUTES.men,
    title: '남성 전체',
    description: '남성 의류 및 상품을 모아보세요.',
  },
]

export const LEGACY_CATEGORY_REDIRECTS = [
  { from: ROUTES.womenTops, to: ROUTES.womenTop },
  { from: ROUTES.womenBottoms, to: ROUTES.womenBottom },
  { from: ROUTES.womenDresses, to: ROUTES.womenDress },
  { from: ROUTES.womenShoes, to: ROUTES.productsShoes },
  { from: ROUTES.womenMisc, to: ROUTES.productsAccessory },
  { from: ROUTES.menTops, to: ROUTES.menTop },
  { from: ROUTES.menBottoms, to: ROUTES.menBottom },
  { from: ROUTES.menShoes, to: ROUTES.productsShoes },
  { from: ROUTES.menMisc, to: ROUTES.productsAccessory },
] as const

export type HomeShortcutIconKey =
  | 'women'
  | 'men'
  | 'new'
  | 'sale'
  | 'perfume'
  | 'shoes'
  | 'bag'
  | 'live'

export interface HomeCategoryShortcut {
  id: string
  label: string
  labelEn: string
  icon: HomeShortcutIconKey
  href: string
  categoryId?: ProductCategoryId
}

const HOME_SHORTCUT_LABEL_EN: Record<string, string> = {
  women: 'WOMEN',
  men: 'MEN',
  new: 'NEW',
  sale: 'SALE',
  live: 'LIVE',
  perfume: 'PERFUME',
  shoes: 'SHOES',
  bag: 'BAG',
}

/** 홈 카테고리 숏컷에 노출할 공용 카테고리 (productCategories 기준) */
export const HOME_FEATURED_COMMON_CATEGORY_IDS: ProductCategoryId[] = ['perfume', 'shoes', 'bag']

export function buildHomeCategoryShortcuts(): HomeCategoryShortcut[] {
  const promoShortcuts: HomeCategoryShortcut[] = [
    {
      id: 'women',
      label: PRODUCT_CATEGORY_GROUP_LABELS.women,
      labelEn: HOME_SHORTCUT_LABEL_EN.women,
      icon: 'women',
      href: ROUTES.women,
    },
    {
      id: 'men',
      label: PRODUCT_CATEGORY_GROUP_LABELS.men,
      labelEn: HOME_SHORTCUT_LABEL_EN.men,
      icon: 'men',
      href: ROUTES.men,
    },
    {
      id: 'new',
      label: '신상품',
      labelEn: HOME_SHORTCUT_LABEL_EN.new,
      icon: 'new',
      href: ROUTES.productsNew,
    },
    {
      id: 'sale',
      label: '특가상품',
      labelEn: HOME_SHORTCUT_LABEL_EN.sale,
      icon: 'sale',
      href: ROUTES.productsSale,
    },
  ]

  const featuredCommonShortcuts = HOME_FEATURED_COMMON_CATEGORY_IDS.map((categoryId) => {
    const definition = getProductCategoryDefinition(categoryId)

    return {
      id: definition.id,
      label: definition.label,
      labelEn: HOME_SHORTCUT_LABEL_EN[definition.id] ?? definition.id.toUpperCase(),
      icon: definition.id as HomeShortcutIconKey,
      href: definition.route,
      categoryId: definition.id,
    }
  })

  return [
    ...promoShortcuts,
    ...featuredCommonShortcuts,
    {
      id: 'live',
      label: '라이브',
      labelEn: HOME_SHORTCUT_LABEL_EN.live,
      icon: 'live',
      href: ROUTES.live,
    },
  ]
}

interface LegacyCategoryFields {
  gender?: string | null
  display_category?: string | null
  detail_category?: string | null
  product_category?: string | null
}

/** DB/레거시 필드에서 통합 카테고리 ID를 해석합니다. */
export function resolveProductCategory(fields: LegacyCategoryFields): ProductCategoryId {
  if (fields.product_category && isProductCategoryId(fields.product_category)) {
    return fields.product_category
  }

  const gender = fields.gender ?? ''
  const display = fields.display_category ?? ''
  const detail = fields.detail_category ?? ''

  if (gender === 'perfume' || detail === 'perfume') {
    return 'perfume'
  }

  if (gender === 'women') {
    if (display === 'top') return 'women_top'
    if (display === 'bottom') return 'women_bottom'
    if (display === 'dress') return 'women_dress'
    if (detail === 'skirt') return 'women_skirt'
    if (display === 'shoes') return 'shoes'
    if (detail === 'bag') return 'bag'
    if (detail === 'belt') return 'belt'
    return 'accessory'
  }

  if (gender === 'men') {
    if (display === 'top') return 'men_top'
    if (display === 'bottom') return 'men_bottom'
    if (display === 'shoes') return 'shoes'
    if (detail === 'bag') return 'bag'
    if (detail === 'belt') return 'belt'
    return 'accessory'
  }

  if (display === 'shoes' || detail === 'sneakers' || detail === 'loafers') {
    return 'shoes'
  }
  if (detail === 'bag') return 'bag'
  if (detail === 'belt') return 'belt'
  if (detail === 'accessory' || detail === 'cap' || detail === 'wallet') {
    return 'accessory'
  }
  if (detail === 'etc' || detail === 'socks') {
    return 'etc'
  }

  return 'etc'
}

/** DB/폼 값을 통합 카테고리 ID로 정규화합니다. 알 수 없는 값은 etc로 fallback. */
export function normalizeProductCategoryId(
  value: string | null | undefined,
  legacyFields?: LegacyCategoryFields,
): ProductCategoryId {
  if (value && isProductCategoryId(value)) {
    return value
  }

  if (legacyFields) {
    return resolveProductCategory(legacyFields)
  }

  return 'etc'
}

/** 통합 카테고리를 레거시 DB 컬럼에 동기화합니다. */
export function syncLegacyCategoryFields(categoryId: ProductCategoryId): {
  gender: string
  display_category: string
  detail_category: string
  product_category: ProductCategoryId
} {
  switch (categoryId) {
    case 'women_top':
      return { gender: 'women', display_category: 'top', detail_category: 'shirt', product_category: categoryId }
    case 'women_bottom':
      return { gender: 'women', display_category: 'bottom', detail_category: 'pants', product_category: categoryId }
    case 'women_dress':
      return { gender: 'women', display_category: 'dress', detail_category: 'dress', product_category: categoryId }
    case 'women_outer':
      return { gender: 'women', display_category: 'top', detail_category: 'hoodie', product_category: categoryId }
    case 'women_skirt':
      return { gender: 'women', display_category: 'bottom', detail_category: 'skirt', product_category: categoryId }
    case 'women_set':
      return { gender: 'women', display_category: 'misc', detail_category: 'etc', product_category: categoryId }
    case 'men_top':
      return { gender: 'men', display_category: 'top', detail_category: 'shirt', product_category: categoryId }
    case 'men_bottom':
      return { gender: 'men', display_category: 'bottom', detail_category: 'pants', product_category: categoryId }
    case 'men_outer':
      return { gender: 'men', display_category: 'top', detail_category: 'hoodie', product_category: categoryId }
    case 'men_set':
      return { gender: 'men', display_category: 'misc', detail_category: 'etc', product_category: categoryId }
    case 'shoes':
      return { gender: 'common', display_category: 'shoes', detail_category: 'sneakers', product_category: categoryId }
    case 'bag':
      return { gender: 'common', display_category: 'misc', detail_category: 'bag', product_category: categoryId }
    case 'belt':
      return { gender: 'common', display_category: 'misc', detail_category: 'belt', product_category: categoryId }
    case 'accessory':
      return { gender: 'common', display_category: 'misc', detail_category: 'accessory', product_category: categoryId }
    case 'perfume':
      return { gender: 'perfume', display_category: 'misc', detail_category: 'accessory', product_category: categoryId }
    case 'etc':
      return { gender: 'common', display_category: 'misc', detail_category: 'etc', product_category: categoryId }
    default:
      return { gender: 'common', display_category: 'misc', detail_category: 'etc', product_category: 'etc' }
  }
}

export function buildStorefrontNavItems(): NavItem[] {
  const womenChildren = getGenderNavCategories('women').map((category) => ({
    label: category.label,
    href: category.route,
  }))

  const menChildren = getGenderNavCategories('men').map((category) => ({
    label: category.label,
    href: category.route,
  }))

  const commonChildren = getProductCategoriesByGroup('common').map((category) => ({
    label: category.label,
    href: category.route,
  }))

  return [
    { label: '홈', href: ROUTES.home },
    { label: '신상품', href: ROUTES.productsNew },
    { label: '인기상품', href: ROUTES.productsBest },
    { label: '특가상품', href: ROUTES.productsSale },
    {
      label: '여성',
      href: ROUTES.women,
      children: womenChildren,
    },
    {
      label: '남성',
      href: ROUTES.men,
      children: menChildren,
    },
    {
      label: PRODUCT_CATEGORY_GROUP_LABELS.common,
      href: ROUTES.products,
      children: commonChildren,
    },
    { label: '라이브방송', href: ROUTES.live },
  ]
}

/** @deprecated buildStorefrontNavItems()와 동일 — 하위 호환용 */
export function buildCategoryDrawerNavItems(): NavItem[] {
  return buildStorefrontNavItems()
}

export const ADMIN_CATEGORY_FILTER_ALL = 'all' as const

export type AdminProductCategoryFilter = typeof ADMIN_CATEGORY_FILTER_ALL | ProductCategoryId

export const ADMIN_CATEGORY_FILTER_OPTIONS: Array<{
  value: AdminProductCategoryFilter
  label: string
}> = [
  { value: ADMIN_CATEGORY_FILTER_ALL, label: '전체 카테고리' },
  ...PRODUCT_CATEGORIES.map((category) => ({
    value: category.id,
    label: getProductCategoryDisplayLabel(category.id),
  })),
]
