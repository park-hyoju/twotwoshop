const DETAIL_VIDEO_PATTERN = /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i

export function isDetailVideoUrl(url: string): boolean {
  return DETAIL_VIDEO_PATTERN.test(url.trim())
}

export function isDetailImageUrl(url: string): boolean {
  return Boolean(url.trim()) && !isDetailVideoUrl(url)
}
