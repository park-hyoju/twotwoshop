export type InquiryReplyTemplateKey =
  | 'shipping'
  | 'exchange'
  | 'refund'
  | 'product'
  | 'payment'
  | 'other'

export interface InquiryReplyTemplate {
  key: InquiryReplyTemplateKey
  label: string
  content: string
}

export const INQUIRY_REPLY_TEMPLATES: InquiryReplyTemplate[] = [
  {
    key: 'shipping',
    label: '배송안내',
    content: `📦 안녕하세요, 고객님 😊
주문해 주셔서 진심으로 감사합니다. 💛
고객님의 상품은 결제 확인 후 평균 3~5일 이내 발송됩니다. (주말 및 공휴일은 배송 기간에서 제외됩니다.)
🚚 택배사 물량 증가, 날씨 등의 사정으로 배송이 다소 지연될 수 있는 점 양해 부탁드립니다.
상품이 출고되면 배송 정보를 빠르게 안내드리겠습니다.
기다려 주셔서 감사합니다. 오늘도 좋은 하루 보내세요! 💕`,
  },
  {
    key: 'exchange',
    label: '교환안내',
    content: `🔄 안녕하세요, 고객님 😊
교환은 상품 수령 후 3일 이내 신청 가능합니다.
📦 상품의 택, 라벨, 포장이 훼손되지 않은 미착용 상품에 한해 교환이 가능합니다.
교환을 원하시는 경우, 📝 주문번호와 교환 사유를 함께 남겨주시면 빠르게 안내 도와드리겠습니다.
※ 단순 변심에 의한 교환의 경우 왕복 배송비가 발생할 수 있습니다.
궁금하신 점이 있으시면 언제든 문의해 주세요. 감사합니다. 💛`,
  },
  {
    key: 'refund',
    label: '환불안내',
    content: `↩️ 안녕하세요, 고객님 😊
반품 및 환불은 상품 수령 후 3일 이내 신청 가능합니다.
📦 단순 변심에 의한 반품의 경우 왕복 배송비가 발생할 수 있습니다.
반품 신청 후 상품이 회수되면, 🔍 상품 상태를 확인한 뒤 순차적으로 환불 처리가 진행됩니다.
※ 상품의 택, 라벨, 포장이 훼손되었거나 사용 흔적이 있는 경우에는 반품 및 환불이 어려울 수 있습니다.
📝 원활한 처리를 위해 주문번호와 반품 사유를 함께 남겨주시면 빠르게 안내해 드리겠습니다.
궁금하신 사항은 언제든 편하게 문의해 주세요. 감사합니다. 💛`,
  },
  {
    key: 'product',
    label: '상품문의',
    content: `🛍️ 안녕하세요, 고객님 😊
문의해 주신 상품 내용을 확인 후 안내드리겠습니다.

색상, 사이즈, 재고, 소재 등 궁금하신 부분을 남겨주시면
빠르게 확인하여 답변드리겠습니다. 💛

조금만 기다려 주세요.
감사합니다. 🌷`,
  },
  {
    key: 'payment',
    label: '입금안내',
    content: `💳 안녕하세요, 고객님 😊
입금이 확인되면 순차적으로 주문 및 배송 준비가 진행됩니다.
📌 입금자명과 주문자명이 다른 경우에는 입금 확인이 지연될 수 있으니, 고객센터 또는 1:1 문의를 통해 입금자명과 주문번호를 함께 남겨주세요.
빠른 확인 후 신속하게 처리해 드리겠습니다. 💛
궁금하신 사항은 언제든 편하게 문의해 주세요. 감사합니다. 😊`,
  },
  {
    key: 'other',
    label: '기타안내',
    content: `💬 안녕하세요, 고객님 😊
문의해 주셔서 감사합니다.
남겨주신 내용은 확인 후 빠르게 안내해 드리겠습니다. 💛 담당자가 순차적으로 확인 중이며, 조금만 기다려 주시면 친절하게 답변드리겠습니다.
추가로 궁금하신 사항이 있으시면 언제든 편하게 문의해 주세요.
감사합니다. 좋은 하루 보내세요! 🌷`,
  },
]

export function getInquiryReplyTemplate(key: InquiryReplyTemplateKey): InquiryReplyTemplate {
  const template = INQUIRY_REPLY_TEMPLATES.find((item) => item.key === key)

  if (!template) {
    throw new Error(`Unknown inquiry reply template: ${key}`)
  }

  return template
}

export const INQUIRY_REPLY_OVERWRITE_CONFIRM_MESSAGE =
  '작성 중인 답변을 템플릿으로 바꿀까요?'

export function shouldConfirmReplyTemplateOverwrite(currentReply: string): boolean {
  return currentReply.trim().length > 0
}
