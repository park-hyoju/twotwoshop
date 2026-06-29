interface ProductExposureBadgesProps {
  isNew: boolean
  isBest: boolean
  isSale: boolean
  size?: 'sm' | 'md'
}

const badgeClassName =
  'rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap sm:text-[13px]'

export function ProductExposureBadges({
  isNew,
  isBest,
  isSale,
  size = 'sm',
}: ProductExposureBadgesProps) {
  if (!isNew && !isBest && !isSale) {
    return null
  }

  const paddingClass = size === 'md' ? 'px-2.5 py-1' : ''

  return (
    <div className="flex flex-wrap gap-1.5">
      {isNew && (
        <span className={`${badgeClassName} ${paddingClass} bg-blue-600 text-white`}>신상품</span>
      )}
      {isBest && (
        <span className={`${badgeClassName} ${paddingClass} bg-amber-500 text-white`}>인기상품</span>
      )}
      {isSale && (
        <span className={`${badgeClassName} ${paddingClass} bg-red-600 text-white`}>특가상품</span>
      )}
    </div>
  )
}
