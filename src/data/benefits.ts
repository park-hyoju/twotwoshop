import type { Benefit } from '../types/benefit'

export const benefits: Benefit[] = [
  {
    id: 'shipping',
    icon: '🚚',
    title: '배송안내',
    description: '주문 확인 후 순차적으로 빠르게 발송됩니다.',
  },
  {
    id: 'consult',
    icon: '💬',
    title: '빠른상담',
    description: '사이트 내 채팅으로 빠르고 친절하게 상담해드립니다.',
  },
  {
    id: 'member',
    icon: '🎁',
    title: '신규회원 혜택',
    description: '회원가입 후 다양한 이벤트와 혜택을 받아보세요.',
  },
]
