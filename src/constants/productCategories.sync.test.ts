import { describe, expect, it } from 'vitest'
import {
  ADMIN_CATEGORY_FILTER_OPTIONS,
  HOME_FEATURED_COMMON_CATEGORY_IDS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_IDS,
  buildHomeCategoryShortcuts,
  buildStorefrontNavItems,
  getAdminCategorySelectOptions,
  getAllProductCategoryIds,
  getProductCategoriesByGroup,
  getProductCategoryRoute,
  isProductCategoryId,
  isProductsNestedCategoryRoute,
  normalizeProductCategoryId,
  resolveProductCategory,
} from './productCategories'

describe('productCategories sync', () => {
  it('keeps admin select values aligned with PRODUCT_CATEGORY_IDS', () => {
    const adminValues = getAdminCategorySelectOptions().flatMap((group) =>
      group.options.map((option) => option.value),
    )

    expect(adminValues).toEqual(getAllProductCategoryIds())
    expect(adminValues).toEqual(PRODUCT_CATEGORY_IDS)
  })

  it('keeps admin filter options aligned with PRODUCT_CATEGORY_IDS', () => {
    const filterValues = ADMIN_CATEGORY_FILTER_OPTIONS.filter((option) => option.value !== 'all').map(
      (option) => option.value,
    )

    expect(filterValues).toEqual(PRODUCT_CATEGORY_IDS)
  })

  it('exposes unique routes for every category', () => {
    const routes = PRODUCT_CATEGORIES.map((category) => category.route)
    expect(new Set(routes).size).toBe(routes.length)
  })

  it('maps every category id to a storefront route', () => {
    for (const categoryId of PRODUCT_CATEGORY_IDS) {
      const route = getProductCategoryRoute(categoryId)
      expect(route.startsWith('/')).toBe(true)
    }
  })

  it('uses common children from productCategories in storefront nav', () => {
    const nav = buildStorefrontNavItems()
    const common = nav.find((item) => item.label === '잡화')

    expect(common?.children?.map((child) => child.label)).toEqual(
      getProductCategoriesByGroup('common').map((category) => category.label),
    )
  })

  it('links home featured shortcuts to valid product categories', () => {
    const shortcuts = buildHomeCategoryShortcuts()

    for (const categoryId of HOME_FEATURED_COMMON_CATEGORY_IDS) {
      const shortcut = shortcuts.find((item) => item.categoryId === categoryId)
      const definition = PRODUCT_CATEGORIES.find((category) => category.id === categoryId)

      expect(shortcut).toBeDefined()
      expect(definition).toBeDefined()
      expect(shortcut?.href).toBe(definition?.route)
    }
  })

  it('normalizes unknown category values to etc', () => {
    expect(normalizeProductCategoryId('unknown-category')).toBe('etc')
    expect(normalizeProductCategoryId(null)).toBe('etc')
  })

  it('resolves legacy fields when product_category is missing', () => {
    expect(
      normalizeProductCategoryId(null, {
        gender: 'women',
        display_category: 'dress',
      }),
    ).toBe('women_dress')
  })

  it('falls back to resolveProductCategory for legacy perfume rows', () => {
    expect(
      resolveProductCategory({
        gender: 'perfume',
        display_category: 'misc',
        detail_category: 'accessory',
      }),
    ).toBe('perfume')
  })

  it('classifies products nested routes under /products', () => {
    const nested = PRODUCT_CATEGORIES.filter((category) => isProductsNestedCategoryRoute(category.route))

    expect(nested.map((category) => category.id).sort()).toEqual(
      ['accessory', 'bag', 'belt', 'etc', 'perfume', 'shoes'].sort(),
    )
  })

  it('validates every PRODUCT_CATEGORY_IDS entry', () => {
    for (const id of PRODUCT_CATEGORY_IDS) {
      expect(isProductCategoryId(id)).toBe(true)
    }
  })
})
