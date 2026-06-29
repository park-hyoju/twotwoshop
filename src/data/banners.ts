import { ROUTES } from '../lib/routes'
import type { LiveBanner } from '../types/banner'

export const liveBanner: LiveBanner = {
  badge: 'LIVE',
  title: '실시간 방송에서 다양한 상품을 만나보세요.',
  ctaLabel: '방송 입장하기',
  ctaHref: ROUTES.live,
}
