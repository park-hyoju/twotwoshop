import { SUPPORT_HOURS_LABEL } from '../lib/supportHours'
import { SHIPPING_POLICY_SUMMARY } from '../lib/orderConstants'
import type { Benefit } from '../types/benefit'

export const benefits: Benefit[] = [
  {
    id: 'shipping',
    icon: 'truck',
    title: '배송 안내',
    description: SHIPPING_POLICY_SUMMARY,
    ctaLabel: '자세히 보기',
    action: 'shipping-modal',
  },
  {
    id: 'consult',
    icon: 'headset',
    title: '1:1 고객상담',
    description: SUPPORT_HOURS_LABEL,
    ctaLabel: '상담하기',
    action: 'open-chat',
  },
  {
    id: 'member',
    icon: 'gift',
    title: '회원혜택',
    description: '신규회원 5,000P 지급',
    ctaLabel: '혜택 보기',
    action: 'member-modal',
  },
]
