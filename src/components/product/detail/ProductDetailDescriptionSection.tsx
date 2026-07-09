import { ProductDescriptionContent } from '../description/ProductDescriptionContent'

interface ProductDetailDescriptionSectionProps {
  shortDescription: string
  description: string
}

export function ProductDetailDescriptionSection({
  shortDescription,
  description,
}: ProductDetailDescriptionSectionProps) {
  return (
    <ProductDescriptionContent
      shortDescription={shortDescription}
      description={description}
      hideWhenEmpty
    />
  )
}
