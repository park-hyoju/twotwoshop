import {
  BenefitSection,
  BestSection,
  CategoryShortcutSection,
  HeroSection,
  LiveSection,
  NewSection,
} from '../components/home'
import { useHomePageData } from '../hooks/useHomePageData'

export function Home() {
  const {
    heroBanner,
    categoryShortcuts,
    bestProducts,
    newProducts,
    isLoadingProducts,
    liveBanner,
    benefits,
  } = useHomePageData()

  return (
    <>
      <HeroSection banner={heroBanner} />
      <CategoryShortcutSection categories={categoryShortcuts} />
      <BestSection products={bestProducts} isLoading={isLoadingProducts} />
      <NewSection products={newProducts} isLoading={isLoadingProducts} />
      <LiveSection banner={liveBanner} />
      <BenefitSection benefits={benefits} />
    </>
  )
}
