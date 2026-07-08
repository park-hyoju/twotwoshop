import {
  DESCRIPTION_ALIGN_CLASS,
  DESCRIPTION_FONT_SIZE_CLASS,
  DESCRIPTION_FONT_WEIGHT_CLASS,
  getProductDescriptionPlainText,
  parseProductDescription,
} from '../../../lib/productDescriptionFormat'
import { getProductDescriptionText } from '../../../lib/productDetailContent'

interface ProductDetailDescriptionSectionProps {
  shortDescription: string
  description: string
}

export function ProductDetailDescriptionSection({
  shortDescription,
  description,
}: ProductDetailDescriptionSectionProps) {
  const raw = getProductDescriptionText(shortDescription, description)
  if (!raw.trim()) {
    return null
  }

  const format = parseProductDescription(description)
  const text = getProductDescriptionPlainText(description) || raw

  return (
    <p
      className={`whitespace-pre-wrap text-neutral-700 ${DESCRIPTION_FONT_SIZE_CLASS[format.fontSize]} ${DESCRIPTION_FONT_WEIGHT_CLASS[format.fontWeight]} ${DESCRIPTION_ALIGN_CLASS[format.align]}`}
    >
      {text}
    </p>
  )
}
