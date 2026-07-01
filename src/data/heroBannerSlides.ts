import { ROUTES } from '../lib/routes'
import type { HeroSlide } from '../types/heroBanner'

export const DEFAULT_HERO_EYEBROW = 'TWOTWOSHOP'
export const DEFAULT_HERO_HEADLINE = '감각적인 데일리 룩,\nTWOTWOSHOP'
export const DEFAULT_HERO_DESCRIPTION = '신규 회원 가입 시 5,000원 쿠폰 지급'
export const DEFAULT_HERO_BUTTON_TEXT = '지금 쇼핑하기'
export const DEFAULT_HERO_BUTTON_LINK = ROUTES.products

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-fallback-1',
    eyebrow: DEFAULT_HERO_EYEBROW,
    headline: DEFAULT_HERO_HEADLINE,
    description: DEFAULT_HERO_DESCRIPTION,
    buttonText: DEFAULT_HERO_BUTTON_TEXT,
    buttonLink: ROUTES.productsNew,
    desktopImage: null,
    mobileImage: null,
  },
  {
    id: 'hero-fallback-2',
    eyebrow: DEFAULT_HERO_EYEBROW,
    headline: '남성 신상 컬렉션',
    description: DEFAULT_HERO_DESCRIPTION,
    buttonText: DEFAULT_HERO_BUTTON_TEXT,
    buttonLink: ROUTES.men,
    desktopImage: null,
    mobileImage: null,
  },
  {
    id: 'hero-fallback-3',
    eyebrow: DEFAULT_HERO_EYEBROW,
    headline: '특가 세일',
    description: DEFAULT_HERO_DESCRIPTION,
    buttonText: DEFAULT_HERO_BUTTON_TEXT,
    buttonLink: ROUTES.productsSale,
    desktopImage: null,
    mobileImage: null,
  },
]
