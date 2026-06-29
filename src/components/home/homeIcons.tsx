import {
  BadgePercent,
  BadgePlus,
  Footprints,
  Gift,
  Headset,
  Radio,
  Shirt,
  ShoppingBag,
  SprayCan,
  Truck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { BenefitIconKey } from '../../types/benefit'
import type { HomeShortcutIconKey } from '../../constants/productCategories'

const ICON_STROKE_WIDTH = 1.8

const CATEGORY_ICON_MAP: Record<HomeShortcutIconKey, LucideIcon> = {
  women: Shirt,
  men: UserRound,
  new: BadgePlus,
  sale: BadgePercent,
  perfume: SprayCan,
  shoes: Footprints,
  bag: ShoppingBag,
  live: Radio,
}

const BENEFIT_ICON_MAP: Record<BenefitIconKey, LucideIcon> = {
  truck: Truck,
  headset: Headset,
  gift: Gift,
}

export function HomeCategoryIcon({
  icon,
  size = 36,
  className = 'text-[#111]',
}: {
  icon: HomeShortcutIconKey
  size?: number
  className?: string
}) {
  const IconComponent = CATEGORY_ICON_MAP[icon]

  return (
    <IconComponent
      size={size}
      strokeWidth={ICON_STROKE_WIDTH}
      className={className}
      aria-hidden="true"
    />
  )
}

export function HomeBenefitIcon({
  icon,
  size = 36,
  className = 'text-[#111]',
}: {
  icon: BenefitIconKey
  size?: number
  className?: string
}) {
  const IconComponent = BENEFIT_ICON_MAP[icon]

  return (
    <IconComponent
      size={size}
      strokeWidth={ICON_STROKE_WIDTH}
      className={className}
      aria-hidden="true"
    />
  )
}
