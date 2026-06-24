export function getProductStorefrontPath(slug: string): string | null {
  const trimmed = slug.trim()
  if (!trimmed) {
    return null
  }

  return `/products/${trimmed}`
}
