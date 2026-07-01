import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { resolveBannerImages, withImageCacheBust } from '../lib/bannerImageResolver'
import type { BannerRow, StorefrontBanner } from '../types/banner'

export class BannerRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'BannerRepositoryError'
    this.cause = cause
  }
}

function mapRow(row: BannerRow): StorefrontBanner {
  const images = resolveBannerImages({
    desktop_image: row.desktop_image,
    mobile_image: row.mobile_image,
  })
  const cacheVersion = row.updated_at ?? row.created_at ?? null

  return {
    id: row.id,
    eyebrow: row.eyebrow,
    headline: row.headline ?? row.title,
    description: row.description,
    buttonText: row.button_text,
    buttonLink: row.button_link,
    desktopImage: withImageCacheBust(images.desktopImage, cacheVersion),
    mobileImage: withImageCacheBust(images.mobileImage, cacheVersion),
    updatedAt: row.updated_at ?? null,
  }
}

export const bannerRepository = {
  async findActiveBanners(): Promise<StorefrontBanner[]> {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    const { data, error } = await supabase
      .from('banners')
      .select(
        'id, title, eyebrow, headline, description, button_text, button_link, desktop_image, mobile_image, sort_order, is_active, created_at, updated_at',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw new BannerRepositoryError('메인 배너를 불러오지 못했습니다.', error)
    }

    return (data as BannerRow[]).map(mapRow)
  },
}
