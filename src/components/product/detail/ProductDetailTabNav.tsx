import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { ProductDetailTab } from './productDetailTabs'
import { PRODUCT_DETAIL_TABS } from './productDetailTabs'

interface ProductDetailTabNavProps {
  activeTab: ProductDetailTab
  onTabChange: (tab: ProductDetailTab) => void
  inline?: boolean
}

interface TabIndicator {
  width: number
  left: number
}

export function ProductDetailTabNav({
  activeTab,
  onTabChange,
  inline = false,
}: ProductDetailTabNavProps) {
  const tabListRef = useRef<HTMLDivElement>(null)
  const tabButtonRefs = useRef<Partial<Record<ProductDetailTab, HTMLButtonElement>>>({})
  const [indicator, setIndicator] = useState<TabIndicator>({ width: 0, left: 0 })

  const updateIndicator = useCallback(() => {
    const tabList = tabListRef.current
    const activeButton = tabButtonRefs.current[activeTab]

    if (!tabList || !activeButton) {
      return
    }

    setIndicator({
      left: activeButton.offsetLeft - tabList.scrollLeft,
      width: activeButton.offsetWidth,
    })
  }, [activeTab])

  useLayoutEffect(() => {
    updateIndicator()

    const tabList = tabListRef.current
    if (!tabList) {
      return
    }

    tabList.addEventListener('scroll', updateIndicator, { passive: true })
    window.addEventListener('resize', updateIndicator)

    return () => {
      tabList.removeEventListener('scroll', updateIndicator)
      window.removeEventListener('resize', updateIndicator)
    }
  }, [updateIndicator])

  return (
    <nav
      aria-label="상품 상세 탭"
      className={
        inline
          ? 'border-b border-neutral-200 bg-white'
          : 'sticky top-16 z-30 -mx-4 border-b border-neutral-200 bg-white sm:-mx-6 lg:-mx-8'
      }
    >
      <div className={inline ? 'relative' : 'relative mx-auto max-w-7xl'}>
        <div
          ref={tabListRef}
          role="tablist"
          className={
            inline
              ? 'flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              : 'flex overflow-x-auto px-4 sm:px-6 lg:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          }
        >
          {PRODUCT_DETAIL_TABS.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabButtonRefs.current[tab.id] = element ?? undefined
                }}
                type="button"
                role="tab"
                id={`product-detail-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls="product-detail-tabpanel"
                onClick={() => onTabChange(tab.id)}
                className={`shrink-0 px-4 py-2.5 text-sm transition-colors duration-200 ${
                  isActive
                    ? 'font-bold text-neutral-900'
                    : 'font-medium text-[#777] hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 h-[3px] bg-neutral-900 transition-[transform,width] duration-[225ms] ease-out"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
      </div>
    </nav>
  )
}
