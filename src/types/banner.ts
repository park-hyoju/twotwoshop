export interface BannerRow {
  id: string
  title: string
  description: string
  button_text: string
  button_link: string
  desktop_image: string | null
  mobile_image: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StorefrontBanner {
  id: string
  title: string
  description: string
  buttonText: string
  buttonLink: string
  desktopImage: string | null
  mobileImage: string | null
}

export interface AdminBannerFormInput {
  title: string
  description: string
  button_text: string
  button_link: string
  desktop_image: string
  mobile_image: string
  is_active: boolean
}

export interface LiveBanner {
  badge: string
  title: string
  ctaLabel: string
  ctaHref: string
}
