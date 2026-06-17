import { Section, SectionTitle } from '../common'
import { ProductGrid } from '../product'
import type { Product } from '../../types/product'
import { ProductLoadingMessage } from '../product/ProductLoadingMessage'

interface BestSectionProps {
  products: Product[]
  isLoading?: boolean
}

export function BestSection({ products, isLoading = false }: BestSectionProps) {
  return (
    <Section id="best" ariaLabel="인기상품" className="bg-neutral-50">
      <SectionTitle title="🔥 인기상품" />
      {isLoading ? <ProductLoadingMessage /> : <ProductGrid products={products} />}
    </Section>
  )
}
