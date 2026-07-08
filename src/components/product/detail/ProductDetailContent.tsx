import { useRef, useState } from 'react'
import type { Product } from '../../../types/product'
import { ProductDetailInfoTab } from './ProductDetailInfoTab'
import { ProductDetailReturnSection } from './ProductDetailReturnSection'
import { ProductDetailShippingSection } from './ProductDetailShippingSection'
import { ProductDetailTabNav } from './ProductDetailTabNav'
import type { ProductDetailTab } from './productDetailTabs'

interface ProductDetailContentProps {
  product: Product
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [activeTab, setActiveTab] = useState<ProductDetailTab>('info')
  const sectionRef = useRef<HTMLElement>(null)

  function handleTabChange(tab: ProductDetailTab) {
    setActiveTab(tab)

    requestAnimationFrame(() => {
      const section = sectionRef.current
      if (!section) {
        return
      }

      const top = section.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top, behavior: 'smooth' })
    })
  }

  return (
    <section ref={sectionRef} className="border-t border-neutral-200 pt-8 sm:pt-10">
      <ProductDetailTabNav activeTab={activeTab} onTabChange={handleTabChange} inline />

      <div
        id="product-detail-tabpanel"
        role="tabpanel"
        aria-labelledby={`product-detail-tab-${activeTab}`}
        className="mx-auto max-w-3xl pt-6 sm:pt-8"
      >
        {activeTab === 'info' && <ProductDetailInfoTab product={product} />}
        {activeTab === 'shipping' && <ProductDetailShippingSection product={product} />}
        {activeTab === 'return' && <ProductDetailReturnSection product={product} />}
      </div>
    </section>
  )
}
