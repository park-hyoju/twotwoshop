import { ADMIN_ROUTES } from './adminRoutes'

export const ADMIN_ORDER_LIST_ROUTES = {
  all: ADMIN_ROUTES.orders,
  pending: ADMIN_ROUTES.orders,
  confirmed: `${ADMIN_ROUTES.orders}?status=confirmed`,
} as const

export const ADMIN_PRODUCT_LIST_ROUTES = {
  all: ADMIN_ROUTES.products,
  soldout: `${ADMIN_ROUTES.products}?status=soldout`,
} as const
