import { Section } from '../common'
import { ProductGrid } from '../product'
import type { Product } from '../../types/product'
import { ProductLoadingMessage } from '../product/ProductLoadingMessage'
import { HomeSectionHeader } from './HomeSectionHeader'

const MAX_HOME_PRODUCTS = 4

interface HomeProductSectionProps {
  id: string
  ariaLabel: string
  eyebrow: string
  title: string
  description: string
  emptyMessage: string
  moreHref: string
  products: Product[]
  isLoading?: boolean
  className?: string
}

export function HomeProductSection({
  id,
  ariaLabel,
  eyebrow,
  title,
  description,
  emptyMessage,
  moreHref,
  products,
  isLoading = false,
  className,
}: HomeProductSectionProps) {
  const visibleProducts = products.slice(0, MAX_HOME_PRODUCTS)

  return (
    <Section id={id} ariaLabel={ariaLabel} className={className}>
      <HomeSectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        moreHref={moreHref}
      />

      <div className="mt-8 sm:mt-10">
        {isLoading ? (
          <ProductLoadingMessage />
        ) : visibleProducts.length === 0 ? (
          <p className="rounded-2xl border border-neutral-100 bg-white px-6 py-12 text-center text-sm text-[#6B7280]">
            {emptyMessage}
          </p>
        ) : (
          <ProductGrid products={visibleProducts} centered />
        )}
      </div>
    </Section>
  )
}
