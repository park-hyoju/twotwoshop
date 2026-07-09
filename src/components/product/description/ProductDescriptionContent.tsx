import { getProductDescriptionText } from '../../../lib/productDetailContent'
import {
  DESCRIPTION_ALIGN_CLASS,
  DESCRIPTION_FONT_SIZE_CLASS,
  DESCRIPTION_FONT_WEIGHT_CLASS,
  getProductDescriptionPlainText,
  parseProductDescription,
} from '../../../lib/productDescriptionFormat'

export interface ProductDescriptionContentProps {
  shortDescription?: string
  description: string
  /** Storefront hides when empty; admin preview shows a placeholder instead. */
  hideWhenEmpty?: boolean
  emptyMessage?: string
}

export function getProductDescriptionContentClassName(description: string): string {
  const format = parseProductDescription(description)

  return [
    'whitespace-pre-wrap text-neutral-700',
    DESCRIPTION_FONT_SIZE_CLASS[format.fontSize],
    DESCRIPTION_FONT_WEIGHT_CLASS[format.fontWeight],
    DESCRIPTION_ALIGN_CLASS[format.align],
  ].join(' ')
}

export function ProductDescriptionContent({
  shortDescription = '',
  description,
  hideWhenEmpty = true,
  emptyMessage = '상품 설명을 입력하면 고객 화면에 이렇게 보입니다.',
}: ProductDescriptionContentProps) {
  const raw = getProductDescriptionText(shortDescription, description)

  if (!raw.trim()) {
    if (hideWhenEmpty) {
      return null
    }

    return (
      <p className="text-base font-normal leading-7 text-neutral-400 sm:text-lg sm:leading-8">
        {emptyMessage}
      </p>
    )
  }

  const text = getProductDescriptionPlainText(description) || raw

  return <p className={getProductDescriptionContentClassName(description)}>{text}</p>
}
