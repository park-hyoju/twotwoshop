import { createElement } from 'react'
import type { RouteObject } from 'react-router-dom'
import { LegacyRouteRedirect } from '../components/routing/LegacyRouteRedirect'
import {
  CATEGORY_GROUP_LANDINGS,
  LEGACY_CATEGORY_REDIRECTS,
  PRODUCT_CATEGORIES,
  getProductsNestedCategoryPath,
  getRootCategoryRouterPath,
  isProductsNestedCategoryRoute,
  type ProductCategoryGroup,
} from '../constants/productCategories'
import { categoryPageById } from '../pages/categories/categoryPagesRegistry'
import { createCategoryGroupProductPage } from '../pages/categories/CategoryProductPages'

const groupPageByGroup = Object.fromEntries(
  CATEGORY_GROUP_LANDINGS.map((landing) => [
    landing.group,
    createCategoryGroupProductPage(landing.group, landing.title, landing.description),
  ]),
) as Record<ProductCategoryGroup, ReturnType<typeof createCategoryGroupProductPage>>

export function buildProductsNestedCategoryRoutes(): RouteObject[] {
  return PRODUCT_CATEGORIES.filter((category) => isProductsNestedCategoryRoute(category.route)).map(
    (category) => ({
      path: getProductsNestedCategoryPath(category.route),
      element: createElement(categoryPageById[category.id]),
    }),
  )
}

export function buildRootCategoryRoutes(): RouteObject[] {
  const groupRoutes = CATEGORY_GROUP_LANDINGS.map((landing) => ({
    path: getRootCategoryRouterPath(landing.route),
    element: createElement(groupPageByGroup[landing.group]),
  }))

  const subcategoryRoutes = PRODUCT_CATEGORIES.filter(
    (category) => !isProductsNestedCategoryRoute(category.route),
  ).map((category) => ({
    path: getRootCategoryRouterPath(category.route),
    element: createElement(categoryPageById[category.id]),
  }))

  const legacyRoutes = LEGACY_CATEGORY_REDIRECTS.map((redirect) => ({
    path: getRootCategoryRouterPath(redirect.from),
    element: createElement(LegacyRouteRedirect, { to: redirect.to }),
  }))

  return [...groupRoutes, ...subcategoryRoutes, ...legacyRoutes]
}
