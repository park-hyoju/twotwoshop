import { ROUTES } from '../lib/routes'
import type { CategoryShortcut } from '../types/category'

export const categoryShortcuts: CategoryShortcut[] = [
  {
    id: 'women',
    label: '여성',
    icon: '👗',
    description: '여성 상품 전체 보기',
    href: ROUTES.women,
  },
  {
    id: 'men',
    label: '남성',
    icon: '👔',
    description: '남성 상품 전체 보기',
    href: ROUTES.men,
  },
  {
    id: 'sale',
    label: '특가상품',
    icon: '🔥',
    description: '할인 상품 모아보기',
    href: ROUTES.productsSale,
  },
  {
    id: 'new',
    label: '신상품',
    icon: '✨',
    description: '최근 등록 상품 보기',
    href: ROUTES.productsNew,
  },
]
