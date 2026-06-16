import { Section, SectionTitle } from '../common'
import { ProductGrid } from '../product'
import type { Product } from '../../types/product'

interface BestSectionProps {
  products: Product[]
}

export function BestSection({ products }: BestSectionProps) {
  return (
    <Section id="best" ariaLabel="인기상품" className="bg-neutral-50">
      <SectionTitle title="🔥 인기상품" />
      <ProductGrid products={products} />
    </Section>
  )
}
