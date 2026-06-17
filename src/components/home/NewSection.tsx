import { Section, SectionTitle } from '../common'
import { ProductGrid } from '../product'
import type { Product } from '../../types/product'
import { ProductLoadingMessage } from '../product/ProductLoadingMessage'

interface NewSectionProps {
  products: Product[]
  isLoading?: boolean
}

export function NewSection({ products, isLoading = false }: NewSectionProps) {
  return (
    <Section id="new" ariaLabel="신상품">
      <SectionTitle title="🆕 신상품" />
      {isLoading ? <ProductLoadingMessage /> : <ProductGrid products={products} />}
    </Section>
  )
}
