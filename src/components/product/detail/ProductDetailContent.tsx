import { useState } from 'react'
import { loadStorePolicy } from '../../../lib/storePolicy'
import type { Product } from '../../../types/product'
import { ProductDetailInfoPanel } from './ProductDetailInfoPanel'
import { ProductDetailReturnSection } from './ProductDetailReturnSection'
import { ProductDetailShippingSection } from './ProductDetailShippingSection'
import { ProductDetailTabNav } from './ProductDetailTabNav'
import type { ProductDetailTab } from './productDetailTabs'

interface ProductDetailContentProps {
  product: Product
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [activeTab, setActiveTab] = useState<ProductDetailTab>('info')
  const policy = loadStorePolicy()

  return (
    <section className="border-t border-neutral-200 pt-6">
      <ProductDetailTabNav activeTab={activeTab} onTabChange={setActiveTab} inline />

      <div
        id="product-detail-tabpanel"
        role="tabpanel"
        aria-labelledby={`product-detail-tab-${activeTab}`}
        className="mx-auto max-w-3xl pt-5"
      >
        {activeTab === 'info' && <ProductDetailInfoPanel product={product} />}
        {activeTab === 'shipping' && (
          <ProductDetailShippingSection shippingInfo={policy.shipping} />
        )}
        {activeTab === 'return' && (
          <ProductDetailReturnSection returnInfo={policy.returns} />
        )}
      </div>
    </section>
  )
}
