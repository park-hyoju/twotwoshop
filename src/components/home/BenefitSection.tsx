import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Headset } from 'lucide-react'
import { Section } from '../common/Section'
import { openChatWidget } from '../../lib/chatWidgetBridge'
import { ROUTES } from '../../lib/routes'
import { loadStorePolicy } from '../../lib/storePolicy'
import { SUPPORT_HOURS_LABEL } from '../../lib/supportHours'
import type { Benefit } from '../../types/benefit'
import { BenefitCard } from './BenefitCard'
import { BenefitInfoModal } from './BenefitInfoModal'

interface BenefitSectionProps {
  benefits: Benefit[]
}

type ActiveModal = 'shipping' | 'member' | null

function PolicyBlock({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="font-semibold text-[#111]">{title}</p>
      <p className="mt-2 whitespace-pre-line">{content}</p>
    </div>
  )
}

export function BenefitSection({ benefits }: BenefitSectionProps) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const shippingPolicy = loadStorePolicy().shipping

  function handleBenefitAction(benefit: Benefit) {
    if (benefit.action === 'shipping-modal') {
      setActiveModal('shipping')
      return
    }

    if (benefit.action === 'open-chat') {
      openChatWidget()
      return
    }

    if (benefit.action === 'member-modal') {
      setActiveModal('member')
    }
  }

  function closeModal() {
    setActiveModal(null)
  }

  return (
    <Section ariaLabel="고객 혜택" className="bg-[#fafafa]">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-xl font-semibold tracking-tight text-[#111] sm:text-2xl">고객 혜택</h2>
        <p className="mt-2 text-sm text-[#888] sm:text-base">
          투투샵만의 쇼핑 혜택을 확인하세요
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {benefits.map((benefit) => (
          <li key={benefit.id} className="h-full">
            <BenefitCard benefit={benefit} onAction={handleBenefitAction} />
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-[20px] border border-[#eee] bg-white px-6 py-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:mt-10 sm:px-10 sm:py-10">
        <p className="text-lg font-semibold tracking-tight text-[#111] sm:text-xl">
          궁금한 점이 있으신가요?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#666] sm:text-[15px]">
          언제든지 1:1 상담으로 친절하게 안내해 드리겠습니다.
        </p>
        <button
          type="button"
          onClick={openChatWidget}
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#111] px-6 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#333] hover:shadow-lg"
        >
          <Headset size={16} strokeWidth={1.8} aria-hidden="true" />
          상담 바로가기
        </button>
      </div>

      <BenefitInfoModal
        isOpen={activeModal === 'shipping'}
        title="배송 안내"
        onClose={closeModal}
      >
        <PolicyBlock title="배송비" content={shippingPolicy.shipping_fee} />
        {shippingPolicy.free_shipping_threshold ? (
          <PolicyBlock title="무료배송" content={shippingPolicy.free_shipping_threshold} />
        ) : null}
        <PolicyBlock title="배송 기간" content={shippingPolicy.delivery_period} />
        <PolicyBlock title="안내 사항" content={shippingPolicy.additional_notes} />
        <p className="text-xs text-[#999]">{SUPPORT_HOURS_LABEL}</p>
      </BenefitInfoModal>

      <BenefitInfoModal
        isOpen={activeModal === 'member'}
        title="회원 혜택"
        onClose={closeModal}
      >
        <PolicyBlock
          title="신규 회원 혜택"
          content={'회원가입 시 5,000P를 드립니다.\n적립금은 추후 주문 시 사용하실 수 있습니다.'}
        />
        <PolicyBlock
          title="혜택 안내"
          content={
            '회원 전용 이벤트, 재입고 알림, 주문 이력 조회 등\n다양한 서비스를 이용하실 수 있습니다.'
          }
        />
        <Link
          to={ROUTES.signin}
          onClick={closeModal}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#111] px-5 text-sm font-semibold text-[#111] transition-colors hover:bg-[#111] hover:text-white"
        >
          회원가입 / 로그인
        </Link>
      </BenefitInfoModal>
    </Section>
  )
}
