import {
  BenefitSection,
  CategoryShortcutSection,
  HeroSection,
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
      <HeroSection banners={banners} isLoading={isLoadingBanners} />
      <CategoryShortcutSection categories={categoryShortcuts} />
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
