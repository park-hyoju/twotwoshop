import { ROUTES } from '../lib/routes'
import type { HeroBanner, LiveBanner } from '../types/banner'

export const heroBanner: HeroBanner = {
  brandName: '투투샵',
  title: '여름 신상품 입고',
  description: '매일 새로운 상품을 만나보세요.',
  ctaLabel: '상품 보러가기',
  ctaHref: ROUTES.productsBest,
  imageAlt: '메인 배너 이미지',
}

export const liveBanner: LiveBanner = {
  badge: '🔴 지금 방송중',
  title: '실시간 방송에서 다양한 상품을 만나보세요.',
  ctaLabel: '방송 입장하기',
  ctaHref: ROUTES.live,
}
