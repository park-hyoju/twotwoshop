/** Slugs from src/data/products.ts and supabase/seed-products.sql (development catalog). */
export const SEED_PRODUCT_SLUGS = [
  'classic-linen-shirt',
  'wide-slacks-pants',
  'flower-midi-dress',
  'canvas-low-sneakers-w',
  'daily-crossbag',
  'summer-blouse',
  'premium-leather-belt-w',
  'ribbon-scarf',
  'mini-tote-bag',
  'soft-knit-cardigan',
  'women-baseball-cap',
  'cooling-golf-tee',
  'stretch-chino-pants',
  'overfit-denim-jacket',
  'lightweight-runner-shoes',
  'basic-leather-belt',
  'airy-cargo-shorts',
  'linen-shirts-m',
  'canvas-low-sneakers-m',
  'leather-wallet',
  'men-baseball-cap',
  'classic-loafers',
] as const

export function isSeedProductSlug(slug: string): boolean {
  return (SEED_PRODUCT_SLUGS as readonly string[]).includes(slug)
}
