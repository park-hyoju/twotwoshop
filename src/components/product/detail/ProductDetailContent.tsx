import { useState } from 'react'
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

  return (
    <section className="mt-4 border-t border-neutral-200 sm:mt-8">
      <ProductDetailTabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        id="product-detail-tabpanel"
        role="tabpanel"
        aria-labelledby={`product-detail-tab-${activeTab}`}
        className="mx-auto max-w-3xl py-8 sm:py-10"
      >
        {activeTab === 'info' && <ProductDetailInfoPanel product={product} />}
        {activeTab === 'shipping' && (
          <ProductDetailShippingSection shippingInfo={product.shippingInfo} />
        )}
        {activeTab === 'return' && <ProductDetailReturnSection returnInfo={product.returnInfo} />}
      </div>
    </section>
  )
}
