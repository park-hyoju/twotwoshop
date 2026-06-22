import { getProductDescriptionText } from '../../../lib/productDetailContent'

interface ProductDetailDescriptionSectionProps {
  shortDescription: string
  description: string
}

export function ProductDetailDescriptionSection({
  shortDescription,
  description,
}: ProductDetailDescriptionSectionProps) {
  const text = getProductDescriptionText(shortDescription, description)

  if (!text) {
    return null
  }

  return (
    <div className="whitespace-pre-wrap text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
      {text}
    </div>
  )
}
