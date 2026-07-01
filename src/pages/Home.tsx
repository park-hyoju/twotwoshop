import {
  BenefitSection,
  CategoryShortcutSection,
  HeroBanner,
  HomeProductSection,
  LiveSection,
} from '../components/home'
import { useHomePageData } from '../hooks/useHomePageData'

export function Home() {
  const {
    banners,
    isLoadingBanners,
    categoryShortcuts,
    homeProductSections,
    isLoadingProducts,
    liveBanner,
    benefits,
  } = useHomePageData()

  return (
    <>
      <HeroBanner banners={banners} isLoading={isLoadingBanners} />
      <CategoryShortcutSection categories={categoryShortcuts} className="!pt-10 sm:!pt-12" />
      {homeProductSections.map((section) => (
        <HomeProductSection
          key={section.id}
          id={section.id}
          ariaLabel={section.ariaLabel}
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
          emptyMessage={section.emptyMessage}
          moreHref={section.moreHref}
          products={section.products}
          isLoading={isLoadingProducts}
          className={section.className}
        />
      ))}
      <LiveSection banner={liveBanner} />
      <BenefitSection benefits={benefits} />
    </>
  )
}
