import { buildStorefrontNavItems } from '../constants/productCategories'

/** PC 헤더 · 모바일 · 전체카테고리 패널 공통 메뉴 */
export const MENU_ITEMS = buildStorefrontNavItems()

/** @deprecated MENU_ITEMS 사용 */
export const NAV_ITEMS = MENU_ITEMS

/** @deprecated MENU_ITEMS 사용 */
export const DRAWER_NAV_ITEMS = MENU_ITEMS
