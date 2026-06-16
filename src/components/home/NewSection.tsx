import { Section, SectionTitle } from '../common'
import { ProductGrid } from '../product'
import type { Product } from '../../types/product'

interface NewSectionProps {
  products: Product[]
}

export function NewSection({ products }: NewSectionProps) {
  return (
    <Section id="new" ariaLabel="신상품">
      <SectionTitle title="🆕 신상품" />
      <ProductGrid products={products} />
    </Section>
  )
}
