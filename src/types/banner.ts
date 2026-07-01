export interface BannerRow {
  id: string
  title: string
  eyebrow: string | null
  headline: string | null
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
  eyebrow: string | null
  headline: string | null
  description: string | null
  buttonText: string | null
  buttonLink: string | null
  desktopImage: string | null
  mobileImage: string | null
  updatedAt: string | null
}

export interface AdminBannerFormInput {
  eyebrow: string
  headline: string
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
