import { ROUTES } from '../lib/routes'
import type { LinkItem } from '../types/navigation'

export const FOOTER_LINKS: LinkItem[] = [
  { label: '공지사항', href: ROUTES.notices },
  { label: '이용약관', href: '#' },
  { label: '개인정보처리방침', href: '#' },
  { label: '배송안내', href: '#' },
  { label: '교환 / 환불', href: '#' },
]
