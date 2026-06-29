import { isSupabaseConfigured, supabase } from '../lib/supabase'
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
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    buttonText: row.button_text,
    buttonLink: row.button_link,
    desktopImage: row.desktop_image,
    mobileImage: row.mobile_image,
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
        'id, title, description, button_text, button_link, desktop_image, mobile_image, sort_order, is_active, created_at, updated_at',
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
