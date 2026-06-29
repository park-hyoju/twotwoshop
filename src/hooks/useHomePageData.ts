import { useEffect, useState } from 'react'
import { benefits, liveBanner } from '../data'
import { buildHomeCategoryShortcuts } from '../constants/productCategories'
import { ROUTES } from '../lib/routes'
import { isSupabaseConfigured } from '../lib/supabase'
import { bannerRepository } from '../services/bannerRepository'
import { productRepository } from '../services/productRepository'
import type { StorefrontBanner } from '../types/banner'
import type { Product } from '../types/product'

export function useHomePageData() {
  const [banners, setBanners] = useState<StorefrontBanner[]>([])
  const [isLoadingBanners, setIsLoadingBanners] = useState(isSupabaseConfigured)
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [bestProducts, setBestProducts] = useState<Product[]>([])
  const [saleProducts, setSaleProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(isSupabaseConfigured)

  useEffect(() => {
    let cancelled = false
    setIsLoadingBanners(isSupabaseConfigured)

    void bannerRepository
      .findActiveBanners()
      .then((rows) => {
        if (!cancelled) {
          setBanners(rows)
          setIsLoadingBanners(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBanners([])
          setIsLoadingBanners(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoadingProducts(isSupabaseConfigured)

    void Promise.all([
      productRepository.findNewProducts(),
      productRepository.findBestProducts(),
      productRepository.findSaleProducts(),
    ]).then(([newest, best, sale]) => {
      if (!cancelled) {
        setNewProducts(newest)
        setBestProducts(best)
        setSaleProducts(sale)
        setIsLoadingProducts(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    banners,
    isLoadingBanners,
    categoryShortcuts: buildHomeCategoryShortcuts(),
    newProducts,
    bestProducts,
    saleProducts,
    isLoadingProducts,
    liveBanner,
    benefits,
    homeProductSections: [
      {
        id: 'new',
        ariaLabel: '신상품',
        eyebrow: 'NEW ARRIVALS',
        title: '신상품',
        description: '가장 먼저 만나보는 이번 주 신상',
        emptyMessage: '등록된 신상품이 없습니다.',
        moreHref: ROUTES.productsNew,
        products: newProducts,
      },
      {
        id: 'best',
        ariaLabel: '인기상품',
        eyebrow: 'BEST SELLERS',
        title: '인기상품',
        description: '고객들이 가장 많이 찾는 상품',
        emptyMessage: '아직 인기상품이 없습니다.',
        moreHref: ROUTES.productsBest,
        products: bestProducts,
        className: 'bg-[#fafafa]',
      },
      {
        id: 'sale',
        ariaLabel: '특가상품',
        eyebrow: 'SPECIAL DEAL',
        title: '특가상품',
        description: '놓치면 아쉬운 특별 할인 상품',
        emptyMessage: '진행 중인 특가상품이 없습니다.',
        moreHref: ROUTES.productsSale,
        products: saleProducts,
      },
    ],
  }
}
