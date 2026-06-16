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
    liveBanner,
    benefits,
  } = useHomePageData()

  return (
    <>
      <HeroSection banner={heroBanner} />
      <CategoryShortcutSection categories={categoryShortcuts} />
      <BestSection products={bestProducts} />
      <NewSection products={newProducts} />
      <LiveSection banner={liveBanner} />
      <BenefitSection benefits={benefits} />
    </>
  )
}
