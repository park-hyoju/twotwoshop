export type BenefitIconKey = 'truck' | 'headset' | 'gift'

export type BenefitAction = 'shipping-modal' | 'open-chat' | 'member-modal'

export interface Benefit {
  id: string
  icon: BenefitIconKey
  title: string
  description: string
  ctaLabel: string
  action: BenefitAction
}
