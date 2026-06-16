import { ROUTES } from '../lib/routes'
import type { NavItem } from '../types/navigation'

export const NAV_ITEMS: NavItem[] = [
  { label: '홈', href: ROUTES.home },
  { label: '신상품', href: ROUTES.productsNew },
  { label: '인기상품', href: ROUTES.productsBest },
  { label: '특가상품', href: ROUTES.productsSale },
  {
    label: '여성',
    href: ROUTES.women,
    children: [
      { label: '상의', href: ROUTES.womenTops },
      { label: '하의', href: ROUTES.womenBottoms },
      { label: '원피스', href: ROUTES.womenDresses },
      { label: '신발', href: ROUTES.womenShoes },
      { label: '잡화', href: ROUTES.womenMisc },
    ],
  },
  {
    label: '남성',
    href: ROUTES.men,
    children: [
      { label: '상의', href: ROUTES.menTops },
      { label: '하의', href: ROUTES.menBottoms },
      { label: '신발', href: ROUTES.menShoes },
      { label: '잡화', href: ROUTES.menMisc },
    ],
  },
  { label: '라이브방송', href: ROUTES.live },
]
